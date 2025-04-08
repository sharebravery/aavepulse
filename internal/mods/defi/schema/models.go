package schema

import (
	"time"

	"github.com/jeremyzhou/aavepulse/internal/config"
	"github.com/shopspring/decimal"
)

const (
	SyncStatusRunning   = "running"
	SyncStatusSucceeded = "succeeded"
	SyncStatusFailed    = "failed"
)

type Protocol struct {
	ID            string    `json:"id" gorm:"size:20;primaryKey"`
	Slug          string    `json:"slug" gorm:"size:64;uniqueIndex"`
	Name          string    `json:"name" gorm:"size:128"`
	Network       string    `json:"network" gorm:"size:64;index"`
	ChainID       int64     `json:"chain_id"`
	GraphEndpoint string    `json:"-" gorm:"size:1024"`
	Demo          bool      `json:"demo" gorm:"index"`
	Enabled       bool      `json:"enabled" gorm:"index"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (*Protocol) TableName() string {
	return config.C.FormatTableName("defi_protocols")
}

type Reserve struct {
	ID                    string          `json:"id" gorm:"size:20;primaryKey"`
	ProtocolID            string          `json:"protocol_id" gorm:"size:20;uniqueIndex:uidx_reserve_market;index"`
	MarketID              string          `json:"market_id" gorm:"size:128;uniqueIndex:uidx_reserve_market"`
	UnderlyingAsset       string          `json:"underlying_asset" gorm:"size:128;index"`
	Symbol                string          `json:"symbol" gorm:"size:32;index"`
	Name                  string          `json:"name" gorm:"size:128"`
	Decimals              int             `json:"decimals"`
	TotalSuppliedUSD      decimal.Decimal `json:"total_supplied_usd" gorm:"type:decimal(38,8)"`
	TotalBorrowedUSD      decimal.Decimal `json:"total_borrowed_usd" gorm:"type:decimal(38,8)"`
	AvailableLiquidityUSD decimal.Decimal `json:"available_liquidity_usd" gorm:"type:decimal(38,8)"`
	UtilizationRate       decimal.Decimal `json:"utilization_rate" gorm:"type:decimal(20,10)"`
	SupplyAPY             decimal.Decimal `json:"supply_apy" gorm:"type:decimal(20,10)"`
	VariableBorrowAPY     decimal.Decimal `json:"variable_borrow_apy" gorm:"type:decimal(20,10)"`
	PriceUSD              decimal.Decimal `json:"price_usd" gorm:"type:decimal(38,8)"`
	Demo                  bool            `json:"demo" gorm:"index"`
	DataUpdatedAt         time.Time       `json:"data_updated_at" gorm:"index"`
	CreatedAt             time.Time       `json:"created_at"`
	UpdatedAt             time.Time       `json:"updated_at"`
}

func (*Reserve) TableName() string {
	return config.C.FormatTableName("defi_reserves")
}

type ReserveSnapshot struct {
	ID                    string          `json:"id" gorm:"size:20;primaryKey"`
	ReserveID             string          `json:"reserve_id" gorm:"size:20;uniqueIndex:uidx_reserve_snapshot;index"`
	TotalSuppliedUSD      decimal.Decimal `json:"total_supplied_usd" gorm:"type:decimal(38,8)"`
	TotalBorrowedUSD      decimal.Decimal `json:"total_borrowed_usd" gorm:"type:decimal(38,8)"`
	AvailableLiquidityUSD decimal.Decimal `json:"available_liquidity_usd" gorm:"type:decimal(38,8)"`
	UtilizationRate       decimal.Decimal `json:"utilization_rate" gorm:"type:decimal(20,10)"`
	SupplyAPY             decimal.Decimal `json:"supply_apy" gorm:"type:decimal(20,10)"`
	VariableBorrowAPY     decimal.Decimal `json:"variable_borrow_apy" gorm:"type:decimal(20,10)"`
	PriceUSD              decimal.Decimal `json:"price_usd" gorm:"type:decimal(38,8)"`
	Demo                  bool            `json:"demo"`
	SnapshotAt            time.Time       `json:"snapshot_at" gorm:"uniqueIndex:uidx_reserve_snapshot;index"`
	CreatedAt             time.Time       `json:"created_at"`
}

func (*ReserveSnapshot) TableName() string {
	return config.C.FormatTableName("defi_reserve_snapshots")
}

type SyncRun struct {
	ID           string     `json:"id" gorm:"size:20;primaryKey"`
	ProtocolID   string     `json:"protocol_id" gorm:"size:20;index"`
	Status       string     `json:"status" gorm:"size:20;index"`
	Source       string     `json:"source" gorm:"size:20;index"`
	ReadCount    int        `json:"read_count"`
	WrittenCount int        `json:"written_count"`
	ErrorSummary string     `json:"error_summary,omitempty" gorm:"size:1024"`
	StartedAt    time.Time  `json:"started_at" gorm:"index"`
	FinishedAt   *time.Time `json:"finished_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

func (*SyncRun) TableName() string {
	return config.C.FormatTableName("defi_sync_runs")
}

type ReserveMetric struct {
	MarketID              string
	UnderlyingAsset       string
	Symbol                string
	Name                  string
	Decimals              int
	TotalSuppliedUSD      decimal.Decimal
	TotalBorrowedUSD      decimal.Decimal
	AvailableLiquidityUSD decimal.Decimal
	UtilizationRate       decimal.Decimal
	SupplyAPY             decimal.Decimal
	VariableBorrowAPY     decimal.Decimal
	PriceUSD              decimal.Decimal
	Demo                  bool
	ObservedAt            time.Time
}

type SnapshotMetric struct {
	MarketID              string
	TotalSuppliedUSD      decimal.Decimal
	TotalBorrowedUSD      decimal.Decimal
	AvailableLiquidityUSD decimal.Decimal
	UtilizationRate       decimal.Decimal
	SupplyAPY             decimal.Decimal
	VariableBorrowAPY     decimal.Decimal
	PriceUSD              decimal.Decimal
	Demo                  bool
	SnapshotAt            time.Time
}

type Overview struct {
	TotalSuppliedUSD      decimal.Decimal `json:"total_supplied_usd"`
	TotalBorrowedUSD      decimal.Decimal `json:"total_borrowed_usd"`
	AvailableLiquidityUSD decimal.Decimal `json:"available_liquidity_usd"`
	UtilizationRate       decimal.Decimal `json:"utilization_rate"`
	ReserveCount          int             `json:"reserve_count"`
	LastSyncedAt          time.Time       `json:"last_synced_at"`
	Demo                  bool            `json:"demo"`
}

type ReserveQueryParam struct {
	Symbol   string `form:"symbol"`
	OrderBy  string `form:"order_by" binding:"omitempty,oneof=total_supplied_usd total_borrowed_usd utilization_rate supply_apy variable_borrow_apy symbol"`
	Order    string `form:"order" binding:"omitempty,oneof=asc desc"`
	Page     int    `form:"page" binding:"omitempty,min=1"`
	PageSize int    `form:"page_size" binding:"omitempty,min=1,max=100"`
}

type ReserveQueryResult struct {
	Data  []*Reserve `json:"data"`
	Total int64      `json:"total"`
}
