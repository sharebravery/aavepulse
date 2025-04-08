package api

import (
	"github.com/gin-gonic/gin"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/biz"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/schema"
	"github.com/jeremyzhou/aavepulse/pkg/util"
)

type Dashboard struct {
	Service *biz.Service
}

// @Tags DeFi
// @Security ApiKeyAuth
// @Summary Get Aave protocol overview
// @Success 200 {object} util.ResponseResult{data=schema.Overview}
// @Router /api/v1/defi/overview [get]
func (a *Dashboard) Overview(c *gin.Context) {
	data, err := a.Service.Overview(c.Request.Context())
	if err != nil {
		util.ResError(c, err)
		return
	}
	util.ResSuccess(c, data)
}

// @Tags DeFi
// @Security ApiKeyAuth
// @Summary Query Aave reserves
// @Param symbol query string false "asset symbol"
// @Param order_by query string false "sort field"
// @Param order query string false "asc or desc"
// @Param page query int false "page" default(1)
// @Param page_size query int false "page size" default(20)
// @Success 200 {object} util.ResponseResult{data=[]schema.Reserve}
// @Router /api/v1/defi/reserves [get]
func (a *Dashboard) Reserves(c *gin.Context) {
	var params schema.ReserveQueryParam
	if err := util.ParseQuery(c, &params); err != nil {
		util.ResError(c, err)
		return
	}
	result, err := a.Service.QueryReserves(c.Request.Context(), params)
	if err != nil {
		util.ResError(c, err)
		return
	}
	util.ResJSON(c, 200, util.ResponseResult{
		Success: true,
		Data:    result.Data,
		Total:   result.Total,
	})
}

// @Tags DeFi
// @Security ApiKeyAuth
// @Summary Get an Aave reserve
// @Param id path string true "reserve ID"
// @Success 200 {object} util.ResponseResult{data=schema.Reserve}
// @Router /api/v1/defi/reserves/{id} [get]
func (a *Dashboard) Reserve(c *gin.Context) {
	data, err := a.Service.GetReserve(c.Request.Context(), c.Param("id"))
	if err != nil {
		util.ResError(c, err)
		return
	}
	util.ResSuccess(c, data)
}

// @Tags DeFi
// @Security ApiKeyAuth
// @Summary Query reserve snapshots
// @Param id path string true "reserve ID"
// @Param range query string false "7d, 30d, or 90d" default(30d)
// @Success 200 {object} util.ResponseResult{data=[]schema.ReserveSnapshot}
// @Router /api/v1/defi/reserves/{id}/snapshots [get]
func (a *Dashboard) Snapshots(c *gin.Context) {
	data, err := a.Service.Snapshots(c.Request.Context(), c.Param("id"), c.Query("range"))
	if err != nil {
		util.ResError(c, err)
		return
	}
	util.ResSuccess(c, data)
}
