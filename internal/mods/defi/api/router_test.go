package api_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jeremyzhou/aavepulse/internal/config"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi"
	"github.com/jeremyzhou/aavepulse/internal/mods/defi/graph"
	"github.com/jeremyzhou/aavepulse/pkg/util"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestDEFIRoutesExposeOverviewReservesAndSnapshots(t *testing.T) {
	gin.SetMode(gin.TestMode)
	autoMigrate := config.C.Storage.DB.AutoMigrate
	config.C.Storage.DB.AutoMigrate = true
	t.Cleanup(func() { config.C.Storage.DB.AutoMigrate = autoMigrate })
	db, err := gorm.Open(sqlite.Open("file:api-test?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	module := defi.New(db, graph.NewDemoSource(time.Date(2026, time.July, 11, 0, 0, 0, 0, time.UTC)))
	require.NoError(t, module.Init(context.Background()))
	_, err = module.Service.Sync(context.Background())
	require.NoError(t, err)

	router := gin.New()
	v1 := router.Group("/api/v1")
	require.NoError(t, module.RegisterV1Routers(context.Background(), v1))

	overview := performRequest(t, router, http.MethodGet, "/api/v1/defi/overview")
	require.Equal(t, http.StatusOK, overview.Code)
	require.Contains(t, overview.Body.String(), `"reserve_count":6`)

	reserves := performRequest(t, router, http.MethodGet, "/api/v1/defi/reserves?page=1&page_size=2")
	require.Equal(t, http.StatusOK, reserves.Code)
	var response util.ResponseResult
	require.NoError(t, json.Unmarshal(reserves.Body.Bytes(), &response))
	require.True(t, response.Success)
	require.EqualValues(t, 6, response.Total)

	var envelope struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(reserves.Body.Bytes(), &envelope))
	require.Len(t, envelope.Data, 2)

	snapshots := performRequest(
		t,
		router,
		http.MethodGet,
		"/api/v1/defi/reserves/"+envelope.Data[0].ID+"/snapshots?range=7d",
	)
	require.Equal(t, http.StatusOK, snapshots.Code)
	require.Contains(t, snapshots.Body.String(), `"success":true`)

	syncRun := performRequest(t, router, http.MethodPost, "/api/v1/defi/sync-runs")
	require.Equal(t, http.StatusOK, syncRun.Code)
	require.Contains(t, syncRun.Body.String(), `"status":"succeeded"`)
}

func performRequest(t *testing.T, handler http.Handler, method, path string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	return recorder
}
