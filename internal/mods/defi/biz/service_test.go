package biz

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jeremyzhou/aavepulse/internal/mods/defi/graph"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/schema"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type blockingSource struct {
	started chan struct{}
	release chan struct{}
}

func (a *blockingSource) Load(context.Context) (*graph.Dataset, error) {
	close(a.started)
	<-a.release
	return nil, errors.New("stop first sync")
}

func TestSyncBuildsQueryableOverviewAndIsIdempotent(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		new(schema.Protocol),
		new(schema.Reserve),
		new(schema.ReserveSnapshot),
		new(schema.SyncRun),
	))

	now := time.Date(2026, time.July, 11, 0, 0, 0, 0, time.UTC)
	service := NewService(db, graph.NewDemoSource(now))
	ctx := context.Background()

	first, err := service.Sync(ctx)
	require.NoError(t, err)
	require.Equal(t, schema.SyncStatusSucceeded, first.Status)
	require.Equal(t, 6, first.WrittenCount)

	second, err := service.Sync(ctx)
	require.NoError(t, err)
	require.Equal(t, schema.SyncStatusSucceeded, second.Status)

	var reserveCount int64
	var snapshotCount int64
	require.NoError(t, db.Model(new(schema.Reserve)).Count(&reserveCount).Error)
	require.NoError(t, db.Model(new(schema.ReserveSnapshot)).Count(&snapshotCount).Error)
	require.EqualValues(t, 6, reserveCount)
	require.EqualValues(t, 6*90, snapshotCount)

	overview, err := service.Overview(ctx)
	require.NoError(t, err)
	require.Equal(t, 6, overview.ReserveCount)
	require.True(t, overview.TotalSuppliedUSD.GreaterThan(overview.TotalBorrowedUSD))
	require.False(t, overview.LastSyncedAt.IsZero())

	result, err := service.QueryReserves(ctx, schema.ReserveQueryParam{
		Symbol:   "USD",
		OrderBy:  "total_supplied_usd",
		Order:    "desc",
		Page:     1,
		PageSize: 10,
	})
	require.NoError(t, err)
	require.NotEmpty(t, result.Data)
	for _, item := range result.Data {
		require.Contains(t, item.Symbol, "USD")
	}

	snapshots, err := service.Snapshots(ctx, result.Data[0].ID, "30d")
	require.NoError(t, err)
	require.Len(t, snapshots, 30)
}

func TestSyncRejectsConcurrentExecution(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:sync-lock?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(new(schema.Protocol), new(schema.SyncRun)))
	source := &blockingSource{started: make(chan struct{}), release: make(chan struct{})}
	service := NewService(db, source)

	firstDone := make(chan error, 1)
	go func() {
		_, syncErr := service.Sync(context.Background())
		firstDone <- syncErr
	}()
	<-source.started

	_, concurrentErr := service.Sync(context.Background())
	require.ErrorContains(t, concurrentErr, "sync is already running")

	close(source.release)
	require.ErrorContains(t, <-firstDone, "stop first sync")
}
