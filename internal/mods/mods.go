package mods

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi"
	"github.com/jeremyzhou/aavepulse/internal/mods/rbac"
)

const (
	apiPrefix = "/api/"
)

// Collection of wire providers
var Set = wire.NewSet(
	wire.Struct(new(Mods), "*"),
	rbac.Set,
	defi.Set,
)

type Mods struct {
	RBAC *rbac.RBAC
	DEFI *defi.DEFI
}

func (a *Mods) Init(ctx context.Context) error {
	if err := a.RBAC.Init(ctx); err != nil {
		return err
	}
	if err := a.DEFI.Init(ctx); err != nil {
		return err
	}

	return nil
}

func (a *Mods) RouterPrefixes() []string {
	return []string{
		apiPrefix,
	}
}

func (a *Mods) RegisterRouters(ctx context.Context, e *gin.Engine) error {
	gAPI := e.Group(apiPrefix)
	v1 := gAPI.Group("v1")

	if err := a.RBAC.RegisterV1Routers(ctx, v1); err != nil {
		return err
	}
	if err := a.DEFI.RegisterV1Routers(ctx, v1); err != nil {
		return err
	}

	return nil
}

func (a *Mods) Release(ctx context.Context) error {
	if err := a.RBAC.Release(ctx); err != nil {
		return err
	}
	if err := a.DEFI.Release(ctx); err != nil {
		return err
	}

	return nil
}
