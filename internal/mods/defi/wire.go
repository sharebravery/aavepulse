package defi

import (
	"github.com/google/wire"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/api"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/biz"
)

var Set = wire.NewSet(
	ProvideSource,
	biz.NewService,
	wire.Struct(new(api.Dashboard), "*"),
	wire.Struct(new(api.Sync), "*"),
	wire.Struct(new(DEFI), "*"),
)
