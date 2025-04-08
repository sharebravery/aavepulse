package graph

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/jeremyzhou/aavepulse/internal/mods/defi/schema"
	"github.com/shopspring/decimal"
)

const reservesQuery = `query AavePulseReserves {
  reserves(first: 100, where: { isActive: true, isDropped: false }) {
    id
    underlyingAsset
    symbol
    name
    decimals
    totalATokenSupply
    totalCurrentVariableDebt
    totalPrincipalStableDebt
    availableLiquidity
    utilizationRate
    liquidityRate
    variableBorrowRate
    price { priceInEth }
    lastUpdateTimestamp
  }
  reserveParamsHistoryItems(first: 1000, orderBy: timestamp, orderDirection: desc) {
    id
    reserve { id decimals }
    totalATokenSupply
    totalCurrentVariableDebt
    totalPrincipalStableDebt
    availableLiquidity
    utilizationRate
    liquidityRate
    variableBorrowRate
    priceInUsd
    timestamp
  }
}`

type Dataset struct {
	Reserves  []schema.ReserveMetric
	Snapshots []schema.SnapshotMetric
	Source    string
}

type Source interface {
	Load(ctx context.Context) (*Dataset, error)
}

type ClientConfig struct {
	Endpoint    string
	APIKey      string
	HTTPClient  *http.Client
	MaxAttempts int
	RetryDelay  time.Duration
	Now         func() time.Time
}

type Client struct {
	config ClientConfig
}

func NewClient(cfg ClientConfig) *Client {
	if cfg.HTTPClient == nil {
		cfg.HTTPClient = &http.Client{Timeout: 15 * time.Second}
	}
	if cfg.MaxAttempts <= 0 {
		cfg.MaxAttempts = 3
	}
	if cfg.RetryDelay <= 0 {
		cfg.RetryDelay = 250 * time.Millisecond
	}
	if cfg.Now == nil {
		cfg.Now = time.Now
	}
	return &Client{config: cfg}
}

func (a *Client) Fetch(ctx context.Context) ([]schema.ReserveMetric, error) {
	dataset, err := a.fetchDataset(ctx)
	if err != nil {
		return nil, err
	}
	return dataset.Reserves, nil
}

func (a *Client) fetchDataset(ctx context.Context) (*Dataset, error) {
	if strings.TrimSpace(a.config.Endpoint) == "" {
		return nil, errors.New("the graph endpoint is required")
	}

	payload, err := json.Marshal(map[string]string{"query": reservesQuery})
	if err != nil {
		return nil, fmt.Errorf("marshal graph query: %w", err)
	}

	var lastErr error
	for attempt := 1; attempt <= a.config.MaxAttempts; attempt++ {
		body, retry, requestErr := a.request(ctx, payload)
		if requestErr == nil {
			return MapDataset(body, a.config.Now().UTC())
		}
		lastErr = requestErr
		if !retry || attempt == a.config.MaxAttempts {
			break
		}

		timer := time.NewTimer(a.config.RetryDelay)
		select {
		case <-ctx.Done():
			timer.Stop()
			return nil, ctx.Err()
		case <-timer.C:
		}
	}
	return nil, lastErr
}

func (a *Client) Load(ctx context.Context) (*Dataset, error) {
	dataset, err := a.fetchDataset(ctx)
	if err != nil {
		return nil, err
	}

	existing := make(map[string]bool, len(dataset.Snapshots))
	for _, item := range dataset.Snapshots {
		existing[snapshotDayKey(item.MarketID, item.SnapshotAt)] = true
	}
	for _, item := range dataset.Reserves {
		key := snapshotDayKey(item.MarketID, item.ObservedAt)
		if !existing[key] {
			dataset.Snapshots = append(dataset.Snapshots, snapshotFromReserve(item, item.ObservedAt))
		}
	}
	return dataset, nil
}

func (a *Client) request(ctx context.Context, payload []byte) ([]byte, bool, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.config.Endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, false, fmt.Errorf("create graph request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if a.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+a.config.APIKey)
	}

	resp, err := a.config.HTTPClient.Do(req)
	if err != nil {
		return nil, true, fmt.Errorf("request the graph: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return nil, true, fmt.Errorf("read graph response: %w", err)
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		retry := resp.StatusCode >= http.StatusInternalServerError
		return nil, retry, fmt.Errorf("the graph returned status %d", resp.StatusCode)
	}
	return body, false, nil
}

type graphResponse struct {
	Data struct {
		Reserves []struct {
			ID                       string `json:"id"`
			UnderlyingAsset          string `json:"underlyingAsset"`
			Symbol                   string `json:"symbol"`
			Name                     string `json:"name"`
			Decimals                 int    `json:"decimals"`
			TotalATokenSupply        string `json:"totalATokenSupply"`
			TotalCurrentVariableDebt string `json:"totalCurrentVariableDebt"`
			TotalPrincipalStableDebt string `json:"totalPrincipalStableDebt"`
			AvailableLiquidity       string `json:"availableLiquidity"`
			UtilizationRate          string `json:"utilizationRate"`
			LiquidityRate            string `json:"liquidityRate"`
			VariableBorrowRate       string `json:"variableBorrowRate"`
			Price                    struct {
				PriceInUSD string `json:"priceInEth"`
			} `json:"price"`
			LastUpdateTimestamp int64 `json:"lastUpdateTimestamp"`
		} `json:"reserves"`
		History []struct {
			ID      string `json:"id"`
			Reserve struct {
				ID       string `json:"id"`
				Decimals int    `json:"decimals"`
			} `json:"reserve"`
			TotalATokenSupply        string `json:"totalATokenSupply"`
			TotalCurrentVariableDebt string `json:"totalCurrentVariableDebt"`
			TotalPrincipalStableDebt string `json:"totalPrincipalStableDebt"`
			AvailableLiquidity       string `json:"availableLiquidity"`
			UtilizationRate          string `json:"utilizationRate"`
			LiquidityRate            string `json:"liquidityRate"`
			VariableBorrowRate       string `json:"variableBorrowRate"`
			PriceInUSD               string `json:"priceInUsd"`
			Timestamp                int64  `json:"timestamp"`
		} `json:"reserveParamsHistoryItems"`
	} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

func MapReserves(body []byte, observedAt time.Time) ([]schema.ReserveMetric, error) {
	dataset, err := MapDataset(body, observedAt)
	if err != nil {
		return nil, err
	}
	return dataset.Reserves, nil
}

func MapDataset(body []byte, observedAt time.Time) (*Dataset, error) {
	var response graphResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("decode graph response: %w", err)
	}
	if len(response.Errors) > 0 {
		return nil, fmt.Errorf("the graph query failed: %s", response.Errors[0].Message)
	}

	reserves := make([]schema.ReserveMetric, 0, len(response.Data.Reserves))
	for _, reserve := range response.Data.Reserves {
		priceUSD := decimalFromString(reserve.Price.PriceInUSD).Shift(-8)
		tokenScale := int32(-reserve.Decimals)
		suppliedTokens := decimalFromString(reserve.TotalATokenSupply).Shift(tokenScale)
		variableDebt := decimalFromString(reserve.TotalCurrentVariableDebt).Shift(tokenScale)
		stableDebt := decimalFromString(reserve.TotalPrincipalStableDebt).Shift(tokenScale)
		availableTokens := decimalFromString(reserve.AvailableLiquidity).Shift(tokenScale)
		supplied := suppliedTokens.Mul(priceUSD)
		borrowed := variableDebt.Add(stableDebt).Mul(priceUSD)
		available := availableTokens.Mul(priceUSD)
		utilization := decimalFromString(reserve.UtilizationRate)
		if utilization.IsZero() && supplied.IsPositive() {
			utilization = borrowed.Div(supplied)
		}

		reserves = append(reserves, schema.ReserveMetric{
			MarketID:              reserve.ID,
			UnderlyingAsset:       reserve.UnderlyingAsset,
			Symbol:                strings.ToUpper(reserve.Symbol),
			Name:                  reserve.Name,
			Decimals:              reserve.Decimals,
			TotalSuppliedUSD:      supplied,
			TotalBorrowedUSD:      borrowed,
			AvailableLiquidityUSD: available,
			UtilizationRate:       utilization,
			SupplyAPY:             rayAPRToAPY(reserve.LiquidityRate),
			VariableBorrowAPY:     rayAPRToAPY(reserve.VariableBorrowRate),
			PriceUSD:              priceUSD,
			ObservedAt:            observedAt.UTC(),
		})
	}

	snapshots := make([]schema.SnapshotMetric, 0, len(response.Data.History))
	seenDays := make(map[string]bool, len(response.Data.History))
	for _, item := range response.Data.History {
		snapshotAt := time.Unix(item.Timestamp, 0).UTC().Truncate(24 * time.Hour)
		key := snapshotDayKey(item.Reserve.ID, snapshotAt)
		if seenDays[key] {
			continue
		}
		seenDays[key] = true

		priceUSD := decimalFromString(item.PriceInUSD).Shift(-8)
		tokenScale := int32(-item.Reserve.Decimals)
		supplied := decimalFromString(item.TotalATokenSupply).Shift(tokenScale).Mul(priceUSD)
		variableDebt := decimalFromString(item.TotalCurrentVariableDebt).Shift(tokenScale)
		stableDebt := decimalFromString(item.TotalPrincipalStableDebt).Shift(tokenScale)
		borrowed := variableDebt.Add(stableDebt).Mul(priceUSD)
		available := decimalFromString(item.AvailableLiquidity).Shift(tokenScale).Mul(priceUSD)
		utilization := decimalFromString(item.UtilizationRate)
		if utilization.IsZero() && supplied.IsPositive() {
			utilization = borrowed.Div(supplied)
		}

		snapshots = append(snapshots, schema.SnapshotMetric{
			MarketID:              item.Reserve.ID,
			TotalSuppliedUSD:      supplied,
			TotalBorrowedUSD:      borrowed,
			AvailableLiquidityUSD: available,
			UtilizationRate:       utilization,
			SupplyAPY:             rayAPRToAPY(item.LiquidityRate),
			VariableBorrowAPY:     rayAPRToAPY(item.VariableBorrowRate),
			PriceUSD:              priceUSD,
			SnapshotAt:            snapshotAt,
		})
	}
	return &Dataset{Reserves: reserves, Snapshots: snapshots, Source: "graph"}, nil
}

func rayAPRToAPY(value string) decimal.Decimal {
	apr, _ := decimalFromString(value).Shift(-27).Float64()
	if apr <= 0 {
		return decimal.Zero
	}
	const secondsPerYear = 31_536_000
	apy := math.Pow(1+apr/secondsPerYear, secondsPerYear) - 1
	return decimal.NewFromFloat(apy)
}

func decimalFromString(value string) decimal.Decimal {
	parsed, err := decimal.NewFromString(value)
	if err != nil {
		return decimal.Zero
	}
	return parsed
}

func snapshotFromReserve(item schema.ReserveMetric, at time.Time) schema.SnapshotMetric {
	return schema.SnapshotMetric{
		MarketID:              item.MarketID,
		TotalSuppliedUSD:      item.TotalSuppliedUSD,
		TotalBorrowedUSD:      item.TotalBorrowedUSD,
		AvailableLiquidityUSD: item.AvailableLiquidityUSD,
		UtilizationRate:       item.UtilizationRate,
		SupplyAPY:             item.SupplyAPY,
		VariableBorrowAPY:     item.VariableBorrowAPY,
		PriceUSD:              item.PriceUSD,
		Demo:                  item.Demo,
		SnapshotAt:            at.UTC(),
	}
}

func snapshotDayKey(marketID string, at time.Time) string {
	return marketID + ":" + at.UTC().Format("2006-01-02")
}
