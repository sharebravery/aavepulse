package graph

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

const reservesFixture = `{
  "data": {
    "reserves": [{
      "id": "0xa0b8",
      "underlyingAsset": "0xa0b8",
      "symbol": "USDC",
      "name": "USDC",
      "decimals": 6,
      "totalATokenSupply": "1000000000",
      "totalCurrentVariableDebt": "400000000",
      "totalPrincipalStableDebt": "0",
      "availableLiquidity": "600000000",
      "utilizationRate": "0.4",
      "liquidityRate": "50000000000000000000000000",
      "variableBorrowRate": "80000000000000000000000000",
      "price": {"priceInEth": "100000000"},
      "lastUpdateTimestamp": 1783728000
    }],
    "reserveParamsHistoryItems": [{
      "id": "history-usdc-1",
      "reserve": {"id": "0xa0b8", "decimals": 6},
      "totalATokenSupply": "950000000",
      "totalCurrentVariableDebt": "350000000",
      "totalPrincipalStableDebt": "0",
      "availableLiquidity": "600000000",
      "utilizationRate": "0.3684210526",
      "liquidityRate": "40000000000000000000000000",
      "variableBorrowRate": "70000000000000000000000000",
      "priceInUsd": "100000000",
      "timestamp": 1783641600
    }]
  }
}`

func TestMapAaveReservesComputesReserveMetrics(t *testing.T) {
	now := time.Date(2026, time.July, 11, 0, 0, 0, 0, time.UTC)

	reserves, err := MapReserves([]byte(reservesFixture), now)

	require.NoError(t, err)
	require.Len(t, reserves, 1)
	require.Equal(t, "USDC", reserves[0].Symbol)
	require.Equal(t, "0.4", reserves[0].UtilizationRate.String())
	require.Equal(t, "1000", reserves[0].TotalSuppliedUSD.String())
	require.Equal(t, "400", reserves[0].TotalBorrowedUSD.String())
	require.Equal(t, "0.051271", reserves[0].SupplyAPY.StringFixed(6))
	require.Equal(t, "0.083287", reserves[0].VariableBorrowAPY.StringFixed(6))
	require.Equal(t, "600", reserves[0].AvailableLiquidityUSD.String())
	require.Equal(t, "1", reserves[0].PriceUSD.String())
}

func TestMapDatasetIncludesAaveHistoricalSnapshots(t *testing.T) {
	now := time.Date(2026, time.July, 11, 0, 0, 0, 0, time.UTC)

	dataset, err := MapDataset([]byte(reservesFixture), now)

	require.NoError(t, err)
	require.Len(t, dataset.Snapshots, 1)
	require.Equal(t, "0xa0b8", dataset.Snapshots[0].MarketID)
	require.Equal(t, "950", dataset.Snapshots[0].TotalSuppliedUSD.String())
	require.Equal(t, "350", dataset.Snapshots[0].TotalBorrowedUSD.String())
	require.Equal(t, time.Date(2026, time.July, 10, 0, 0, 0, 0, time.UTC), dataset.Snapshots[0].SnapshotAt)
}

func TestClientRetriesTransientGraphErrors(t *testing.T) {
	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			http.Error(w, "temporary", http.StatusBadGateway)
			return
		}
		require.Equal(t, "Bearer graph-test-key", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(reservesFixture))
	}))
	defer server.Close()

	client := NewClient(ClientConfig{
		Endpoint:    server.URL,
		APIKey:      "graph-test-key",
		MaxAttempts: 3,
		RetryDelay:  time.Millisecond,
	})
	reserves, err := client.Fetch(context.Background())

	require.NoError(t, err)
	require.Len(t, reserves, 1)
	require.Equal(t, 3, attempts)
}

func TestDemoDatasetContainsNinetyDaysForEveryReserve(t *testing.T) {
	now := time.Date(2026, time.July, 11, 0, 0, 0, 0, time.UTC)

	dataset := NewDemoDataset(now)

	require.Len(t, dataset.Reserves, 6)
	require.Len(t, dataset.Snapshots, 6*90)
	for _, reserve := range dataset.Reserves {
		require.True(t, reserve.Demo)
	}
}
