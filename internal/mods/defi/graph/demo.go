package graph

import (
	"context"
	"time"

	"github.com/jeremyzhou/aavepulse/internal/mods/defi/schema"
	"github.com/shopspring/decimal"
)

type DemoSource struct {
	dataset *Dataset
}

func NewDemoSource(now time.Time) *DemoSource {
	return &DemoSource{dataset: NewDemoDataset(now)}
}

func (a *DemoSource) Load(context.Context) (*Dataset, error) {
	return a.dataset, nil
}

func NewDemoDataset(now time.Time) *Dataset {
	type seed struct {
		symbol   string
		name     string
		asset    string
		decimals int
		supplied int64
		borrowed int64
		price    string
		supply   string
		borrow   string
	}
	seeds := []seed{
		{symbol: "WETH", name: "Wrapped Ether", asset: "0xc02a", decimals: 18, supplied: 2_800_000_000, borrowed: 1_820_000_000, price: "3150", supply: "0.024", borrow: "0.037"},
		{symbol: "USDC", name: "USD Coin", asset: "0xa0b8", decimals: 6, supplied: 4_200_000_000, borrowed: 3_150_000_000, price: "1", supply: "0.041", borrow: "0.056"},
		{symbol: "DAI", name: "Dai Stablecoin", asset: "0x6b17", decimals: 18, supplied: 1_350_000_000, borrowed: 890_000_000, price: "1", supply: "0.035", borrow: "0.049"},
		{symbol: "USDT", name: "Tether USD", asset: "0xdac1", decimals: 6, supplied: 1_100_000_000, borrowed: 790_000_000, price: "1", supply: "0.038", borrow: "0.052"},
		{symbol: "wstETH", name: "Wrapped stETH", asset: "0x7f39", decimals: 18, supplied: 2_050_000_000, borrowed: 510_000_000, price: "3750", supply: "0.008", borrow: "0.028"},
		{symbol: "WBTC", name: "Wrapped Bitcoin", asset: "0x2260", decimals: 8, supplied: 940_000_000, borrowed: 360_000_000, price: "66000", supply: "0.012", borrow: "0.032"},
	}

	observedAt := now.UTC().Truncate(24 * time.Hour)
	reserves := make([]schema.ReserveMetric, 0, len(seeds))
	snapshots := make([]schema.SnapshotMetric, 0, len(seeds)*90)
	for seedIndex, item := range seeds {
		supplied := decimal.NewFromInt(item.supplied)
		borrowed := decimal.NewFromInt(item.borrowed)
		reserve := schema.ReserveMetric{
			MarketID:              "aave-v3-ethereum-" + item.symbol,
			UnderlyingAsset:       item.asset,
			Symbol:                item.symbol,
			Name:                  item.name,
			Decimals:              item.decimals,
			TotalSuppliedUSD:      supplied,
			TotalBorrowedUSD:      borrowed,
			AvailableLiquidityUSD: supplied.Sub(borrowed),
			UtilizationRate:       borrowed.Div(supplied),
			SupplyAPY:             decimal.RequireFromString(item.supply),
			VariableBorrowAPY:     decimal.RequireFromString(item.borrow),
			PriceUSD:              decimal.RequireFromString(item.price),
			Demo:                  true,
			ObservedAt:            observedAt,
		}
		reserves = append(reserves, reserve)

		for day := 89; day >= 0; day-- {
			factorBPS := int64(9_550 + ((89-day)*5+seedIndex*13)%900)
			factor := decimal.NewFromInt(factorBPS).Div(decimal.NewFromInt(10_000))
			dayReserve := reserve
			dayReserve.TotalSuppliedUSD = reserve.TotalSuppliedUSD.Mul(factor)
			borrowFactor := factor.Add(decimal.NewFromInt(int64((day + seedIndex) % 25)).Div(decimal.NewFromInt(10_000)))
			dayReserve.TotalBorrowedUSD = reserve.TotalBorrowedUSD.Mul(borrowFactor)
			dayReserve.AvailableLiquidityUSD = dayReserve.TotalSuppliedUSD.Sub(dayReserve.TotalBorrowedUSD)
			dayReserve.UtilizationRate = dayReserve.TotalBorrowedUSD.Div(dayReserve.TotalSuppliedUSD)
			dayReserve.SupplyAPY = reserve.SupplyAPY.Mul(factor)
			dayReserve.VariableBorrowAPY = reserve.VariableBorrowAPY.Mul(borrowFactor)
			snapshots = append(snapshots, snapshotFromReserve(dayReserve, observedAt.AddDate(0, 0, -day)))
		}
	}

	return &Dataset{Reserves: reserves, Snapshots: snapshots, Source: "demo"}
}
