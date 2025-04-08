package api

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/biz"
	"github.com/jeremyzhou/aavepulse/pkg/util"
)

type Sync struct {
	Service *biz.Service
}

// @Tags DeFi
// @Security ApiKeyAuth
// @Summary Query Aave synchronization runs
// @Param page query int false "page" default(1)
// @Param page_size query int false "page size" default(20)
// @Success 200 {object} util.ResponseResult
// @Router /api/v1/defi/sync-runs [get]
func (a *Sync) Runs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	data, total, err := a.Service.SyncRuns(c.Request.Context(), page, pageSize)
	if err != nil {
		util.ResError(c, err)
		return
	}
	util.ResJSON(c, 200, util.ResponseResult{Success: true, Data: data, Total: total})
}

// @Tags DeFi
// @Security ApiKeyAuth
// @Summary Run Aave synchronization
// @Success 200 {object} util.ResponseResult
// @Failure 409 {object} util.ResponseResult
// @Router /api/v1/defi/sync-runs [post]
func (a *Sync) Run(c *gin.Context) {
	data, err := a.Service.Sync(c.Request.Context())
	if err != nil {
		util.ResError(c, err)
		return
	}
	util.ResSuccess(c, data)
}
