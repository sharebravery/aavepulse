package defi

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jeremyzhou/aavepulse/internal/config"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/api"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/biz"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/graph"
	"gorm.io/gorm"
)

type DEFI struct {
	Service      *biz.Service
	DashboardAPI *api.Dashboard
	SyncAPI      *api.Sync
}

func New(db *gorm.DB, source graph.Source) *DEFI {
	service := biz.NewService(db, source)
	return &DEFI{
		Service:      service,
		DashboardAPI: &api.Dashboard{Service: service},
		SyncAPI:      &api.Sync{Service: service},
	}
}

func ProvideSource() graph.Source {
	if config.C.DeFi.Demo {
		return graph.NewDemoSource(time.Now())
	}
	return graph.NewClient(graph.ClientConfig{
		Endpoint: config.C.DeFi.Graph.Endpoint,
		APIKey:   config.C.DeFi.Graph.APIKey,
		HTTPClient: &http.Client{
			Timeout: time.Duration(config.C.DeFi.Graph.Timeout) * time.Second,
		},
		MaxAttempts: config.C.DeFi.Graph.MaxAttempts,
		RetryDelay:  time.Duration(config.C.DeFi.Graph.RetryDelay) * time.Millisecond,
	})
}

func (a *DEFI) Init(ctx context.Context) error {
	if config.C.Storage.DB.AutoMigrate {
		if err := a.Service.AutoMigrate(ctx); err != nil {
			return err
		}
	}
	if !config.C.DeFi.AutoSync {
		return nil
	}
	overview, err := a.Service.Overview(ctx)
	if err != nil {
		return err
	}
	if overview.ReserveCount == 0 {
		_, err = a.Service.Sync(ctx)
	}
	return err
}

func (a *DEFI) RegisterV1Routers(_ context.Context, v1 *gin.RouterGroup) error {
	group := v1.Group("defi")
	group.GET("overview", a.DashboardAPI.Overview)
	group.GET("reserves", a.DashboardAPI.Reserves)
	group.GET("reserves/:id", a.DashboardAPI.Reserve)
	group.GET("reserves/:id/snapshots", a.DashboardAPI.Snapshots)
	group.GET("sync-runs", a.SyncAPI.Runs)
	group.POST("sync-runs", a.SyncAPI.Run)
	return nil
}

func (*DEFI) Release(context.Context) error {
	return nil
}
