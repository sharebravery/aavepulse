package biz

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/jeremyzhou/aavepulse/internal/mods/defi/dal"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/graph"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/schema"
	appErrors "github.com/jeremyzhou/aavepulse/pkg/errors"
	"github.com/jeremyzhou/aavepulse/pkg/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type Service struct {
	Repository *dal.Repository
	Source     graph.Source
	now        func() time.Time
	syncLock   sync.Mutex
}

func NewService(db *gorm.DB, source graph.Source) *Service {
	return &Service{
		Repository: &dal.Repository{DB: db},
		Source:     source,
		now:        time.Now,
	}
}

func (a *Service) AutoMigrate(ctx context.Context) error {
	return a.Repository.AutoMigrate(ctx)
}

func (a *Service) Sync(ctx context.Context) (*schema.SyncRun, error) {
	if !a.syncLock.TryLock() {
		return nil, appErrors.Conflict("defi.sync_running", "a sync is already running")
	}
	defer a.syncLock.Unlock()

	dataset, err := a.Source.Load(ctx)
	demo := err == nil && dataset.Source == "demo"
	protocol, protocolErr := a.Repository.EnsureProtocol(ctx, "", demo)
	if protocolErr != nil {
		return nil, protocolErr
	}

	run := &schema.SyncRun{
		ID:         util.NewXID(),
		ProtocolID: protocol.ID,
		Status:     schema.SyncStatusRunning,
		Source:     "graph",
		StartedAt:  a.now().UTC(),
	}
	if demo {
		run.Source = "demo"
	}
	if createErr := a.Repository.CreateSyncRun(ctx, run); createErr != nil {
		return nil, createErr
	}
	if err != nil {
		return a.finishFailedRun(ctx, run, err)
	}

	run.ReadCount = len(dataset.Reserves)
	written, err := a.Repository.ApplyDataset(ctx, protocol, dataset)
	if err != nil {
		return a.finishFailedRun(ctx, run, err)
	}
	run.WrittenCount = written
	run.Status = schema.SyncStatusSucceeded
	finishedAt := a.now().UTC()
	run.FinishedAt = &finishedAt
	if err := a.Repository.UpdateSyncRun(ctx, run); err != nil {
		return nil, err
	}
	return run, nil
}

func (a *Service) finishFailedRun(
	ctx context.Context,
	run *schema.SyncRun,
	cause error,
) (*schema.SyncRun, error) {
	run.Status = schema.SyncStatusFailed
	run.ErrorSummary = cause.Error()
	if len(run.ErrorSummary) > 1024 {
		run.ErrorSummary = run.ErrorSummary[:1024]
	}
	finishedAt := a.now().UTC()
	run.FinishedAt = &finishedAt
	if err := a.Repository.UpdateSyncRun(ctx, run); err != nil {
		return nil, err
	}
	return run, cause
}

func (a *Service) Overview(ctx context.Context) (*schema.Overview, error) {
	reserves, err := a.Repository.ListAllReserves(ctx)
	if err != nil {
		return nil, err
	}
	overview := &schema.Overview{
		TotalSuppliedUSD:      decimal.Zero,
		TotalBorrowedUSD:      decimal.Zero,
		AvailableLiquidityUSD: decimal.Zero,
		UtilizationRate:       decimal.Zero,
		ReserveCount:          len(reserves),
	}
	for _, item := range reserves {
		overview.TotalSuppliedUSD = overview.TotalSuppliedUSD.Add(item.TotalSuppliedUSD)
		overview.TotalBorrowedUSD = overview.TotalBorrowedUSD.Add(item.TotalBorrowedUSD)
		overview.AvailableLiquidityUSD = overview.AvailableLiquidityUSD.Add(item.AvailableLiquidityUSD)
		overview.Demo = overview.Demo || item.Demo
		if item.DataUpdatedAt.After(overview.LastSyncedAt) {
			overview.LastSyncedAt = item.DataUpdatedAt
		}
	}
	if overview.TotalSuppliedUSD.IsPositive() {
		overview.UtilizationRate = overview.TotalBorrowedUSD.Div(overview.TotalSuppliedUSD)
	}
	return overview, nil
}

func (a *Service) QueryReserves(
	ctx context.Context,
	params schema.ReserveQueryParam,
) (*schema.ReserveQueryResult, error) {
	return a.Repository.ListReserves(ctx, params)
}

func (a *Service) GetReserve(ctx context.Context, id string) (*schema.Reserve, error) {
	item, err := a.Repository.GetReserve(ctx, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, appErrors.NotFound("defi.reserve_not_found", "reserve not found")
	}
	return item, nil
}

func (a *Service) Snapshots(
	ctx context.Context,
	reserveID string,
	rangeName string,
) ([]*schema.ReserveSnapshot, error) {
	days := 30
	switch strings.ToLower(rangeName) {
	case "7d":
		days = 7
	case "30d", "":
		days = 30
	case "90d":
		days = 90
	default:
		return nil, appErrors.BadRequest("defi.invalid_range", "range must be 7d, 30d, or 90d")
	}
	if _, err := a.GetReserve(ctx, reserveID); err != nil {
		return nil, err
	}

	// Include the current UTC day as one of the requested data points.
	since := a.now().UTC().Truncate(24*time.Hour).AddDate(0, 0, -(days - 1))
	items, err := a.Repository.ListSnapshots(ctx, reserveID, since)
	if err != nil {
		return nil, err
	}
	if len(items) > days {
		items = items[len(items)-days:]
	}
	return items, nil
}

func (a *Service) SyncRuns(ctx context.Context, page, pageSize int) ([]*schema.SyncRun, int64, error) {
	return a.Repository.ListSyncRuns(ctx, page, pageSize)
}

func (a *Service) SourceDescription() string {
	return fmt.Sprintf("%T", a.Source)
}
