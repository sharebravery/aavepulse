package dal

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jeremyzhou/aavepulse/internal/mods/defi/graph"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/schema"
	"github.com/jeremyzhou/aavepulse/pkg/errors"
	"github.com/jeremyzhou/aavepulse/pkg/util"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository struct {
	DB *gorm.DB
}

func (a *Repository) AutoMigrate(ctx context.Context) error {
	return a.DB.WithContext(ctx).AutoMigrate(
		new(schema.Protocol),
		new(schema.Reserve),
		new(schema.ReserveSnapshot),
		new(schema.SyncRun),
	)
}

func (a *Repository) EnsureProtocol(ctx context.Context, endpoint string, demo bool) (*schema.Protocol, error) {
	var item schema.Protocol
	result := a.DB.WithContext(ctx).Where("slug = ?", "aave-v3-ethereum").First(&item)
	if result.Error == nil {
		return &item, nil
	}
	if result.Error != gorm.ErrRecordNotFound {
		return nil, errors.WithStack(result.Error)
	}

	item = schema.Protocol{
		ID:            util.NewXID(),
		Slug:          "aave-v3-ethereum",
		Name:          "Aave V3",
		Network:       "ethereum",
		ChainID:       1,
		GraphEndpoint: endpoint,
		Demo:          demo,
		Enabled:       true,
	}
	result = a.DB.WithContext(ctx).Create(&item)
	if result.Error != nil {
		return nil, errors.WithStack(result.Error)
	}
	return &item, nil
}

func (a *Repository) CreateSyncRun(ctx context.Context, item *schema.SyncRun) error {
	return errors.WithStack(a.DB.WithContext(ctx).Create(item).Error)
}

func (a *Repository) UpdateSyncRun(ctx context.Context, item *schema.SyncRun) error {
	return errors.WithStack(a.DB.WithContext(ctx).
		Model(new(schema.SyncRun)).
		Where("id = ?", item.ID).
		Select("status", "source", "read_count", "written_count", "error_summary", "finished_at").
		Updates(item).Error)
}

func (a *Repository) ApplyDataset(
	ctx context.Context,
	protocol *schema.Protocol,
	dataset *graph.Dataset,
) (int, error) {
	written := 0
	err := a.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		reserveIDs := make(map[string]string, len(dataset.Reserves))
		for _, metric := range dataset.Reserves {
			id, err := upsertReserve(tx, protocol.ID, metric)
			if err != nil {
				return err
			}
			reserveIDs[metric.MarketID] = id
			written++
		}

		for _, metric := range dataset.Snapshots {
			reserveID := reserveIDs[metric.MarketID]
			if reserveID == "" {
				continue
			}
			if err := upsertSnapshot(tx, reserveID, metric); err != nil {
				return err
			}
		}
		return nil
	})
	return written, errors.WithStack(err)
}

func upsertReserve(tx *gorm.DB, protocolID string, metric schema.ReserveMetric) (string, error) {
	var existing schema.Reserve
	result := tx.Where("protocol_id = ? AND market_id = ?", protocolID, metric.MarketID).First(&existing)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return "", result.Error
	}

	id := existing.ID
	if id == "" {
		id = util.NewXID()
	}
	item := &schema.Reserve{
		ID:                    id,
		ProtocolID:            protocolID,
		MarketID:              metric.MarketID,
		UnderlyingAsset:       metric.UnderlyingAsset,
		Symbol:                metric.Symbol,
		Name:                  metric.Name,
		Decimals:              metric.Decimals,
		TotalSuppliedUSD:      metric.TotalSuppliedUSD,
		TotalBorrowedUSD:      metric.TotalBorrowedUSD,
		AvailableLiquidityUSD: metric.AvailableLiquidityUSD,
		UtilizationRate:       metric.UtilizationRate,
		SupplyAPY:             metric.SupplyAPY,
		VariableBorrowAPY:     metric.VariableBorrowAPY,
		PriceUSD:              metric.PriceUSD,
		Demo:                  metric.Demo,
		DataUpdatedAt:         metric.ObservedAt,
	}
	err := tx.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "protocol_id"}, {Name: "market_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"underlying_asset", "symbol", "name", "decimals", "total_supplied_usd",
			"total_borrowed_usd", "available_liquidity_usd", "utilization_rate",
			"supply_apy", "variable_borrow_apy", "price_usd", "demo", "data_updated_at", "updated_at",
		}),
	}).Create(item).Error
	return id, err
}

func upsertSnapshot(tx *gorm.DB, reserveID string, metric schema.SnapshotMetric) error {
	item := &schema.ReserveSnapshot{
		ID:                    util.NewXID(),
		ReserveID:             reserveID,
		TotalSuppliedUSD:      metric.TotalSuppliedUSD,
		TotalBorrowedUSD:      metric.TotalBorrowedUSD,
		AvailableLiquidityUSD: metric.AvailableLiquidityUSD,
		UtilizationRate:       metric.UtilizationRate,
		SupplyAPY:             metric.SupplyAPY,
		VariableBorrowAPY:     metric.VariableBorrowAPY,
		PriceUSD:              metric.PriceUSD,
		Demo:                  metric.Demo,
		SnapshotAt:            metric.SnapshotAt,
	}
	return tx.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "reserve_id"}, {Name: "snapshot_at"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"total_supplied_usd", "total_borrowed_usd", "available_liquidity_usd",
			"utilization_rate", "supply_apy", "variable_borrow_apy", "price_usd", "demo",
		}),
	}).Create(item).Error
}

func (a *Repository) ListReserves(
	ctx context.Context,
	params schema.ReserveQueryParam,
) (*schema.ReserveQueryResult, error) {
	db := a.DB.WithContext(ctx).Model(new(schema.Reserve))
	if symbol := strings.TrimSpace(params.Symbol); symbol != "" {
		db = db.Where("UPPER(symbol) LIKE ?", "%"+strings.ToUpper(symbol)+"%")
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, errors.WithStack(err)
	}
	orderBy := params.OrderBy
	allowed := map[string]bool{
		"total_supplied_usd":  true,
		"total_borrowed_usd":  true,
		"utilization_rate":    true,
		"supply_apy":          true,
		"variable_borrow_apy": true,
		"symbol":              true,
	}
	if !allowed[orderBy] {
		orderBy = "total_supplied_usd"
	}
	direction := strings.ToUpper(params.Order)
	if direction != "ASC" {
		direction = "DESC"
	}
	page := params.Page
	if page <= 0 {
		page = 1
	}
	pageSize := params.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	items := make([]*schema.Reserve, 0)
	if err := db.Order(fmt.Sprintf("%s %s", orderBy, direction)).
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&items).Error; err != nil {
		return nil, errors.WithStack(err)
	}
	return &schema.ReserveQueryResult{Data: items, Total: total}, nil
}

func (a *Repository) GetReserve(ctx context.Context, id string) (*schema.Reserve, error) {
	var item schema.Reserve
	result := a.DB.WithContext(ctx).Where("id = ?", id).First(&item)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &item, errors.WithStack(result.Error)
}

func (a *Repository) ListAllReserves(ctx context.Context) ([]*schema.Reserve, error) {
	items := make([]*schema.Reserve, 0)
	err := a.DB.WithContext(ctx).Order("total_supplied_usd DESC").Find(&items).Error
	return items, errors.WithStack(err)
}

func (a *Repository) ListSnapshots(
	ctx context.Context,
	reserveID string,
	since time.Time,
) ([]*schema.ReserveSnapshot, error) {
	items := make([]*schema.ReserveSnapshot, 0)
	err := a.DB.WithContext(ctx).
		Where("reserve_id = ? AND snapshot_at >= ?", reserveID, since).
		Order("snapshot_at ASC").
		Find(&items).Error
	return items, errors.WithStack(err)
}

func (a *Repository) ListSyncRuns(ctx context.Context, page, pageSize int) ([]*schema.SyncRun, int64, error) {
	db := a.DB.WithContext(ctx).Model(new(schema.SyncRun))
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, errors.WithStack(err)
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}
	items := make([]*schema.SyncRun, 0)
	err := db.Order("started_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error
	return items, total, errors.WithStack(err)
}
