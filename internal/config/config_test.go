package config

import (
	"strings"
	"testing"

	"github.com/jeremyzhou/aavepulse/pkg/logging"
	"github.com/stretchr/testify/require"
)

func TestPreLoadAppliesEnvironmentOverrides(t *testing.T) {
	t.Setenv("AAVEPULSE_DATABASE_DSN", "host=db.example dbname=aavepulse")
	t.Setenv("AAVEPULSE_DATABASE_TYPE", "sqlite3")
	t.Setenv("AAVEPULSE_GRAPH_ENDPOINT", "https://graph.example/subgraphs/id/aave")
	t.Setenv("AAVEPULSE_GRAPH_API_KEY", "graph-api-test-key")
	t.Setenv("AAVEPULSE_DEMO_MODE", "false")
	t.Setenv("AAVEPULSE_JWT_SIGNING_KEY", "test-signing-key")

	var cfg Config
	cfg.DeFi.Demo = true
	cfg.Logger.Hooks = append(cfg.Logger.Hooks, &logging.HookConfig{
		Type:    "gorm",
		Options: map[string]string{"DBType": "postgres", "DSN": "old-dsn"},
	})
	cfg.PreLoad()

	require.Equal(t, "host=db.example dbname=aavepulse", cfg.Storage.DB.DSN)
	require.Equal(t, "sqlite3", cfg.Storage.DB.Type)
	require.Equal(t, "sqlite3", cfg.Logger.Hooks[0].Options["DBType"])
	require.Equal(t, "host=db.example dbname=aavepulse", cfg.Logger.Hooks[0].Options["DSN"])
	require.Equal(t, "https://graph.example/subgraphs/id/aave", cfg.DeFi.Graph.Endpoint)
	require.Equal(t, "graph-api-test-key", cfg.DeFi.Graph.APIKey)
	require.False(t, cfg.DeFi.Demo)
	require.Equal(t, "test-signing-key", cfg.Middleware.Auth.SigningKey)
}

func TestStringRedactsSensitiveConfiguration(t *testing.T) {
	var cfg Config
	cfg.Storage.DB.DSN = "host=localhost password=super-secret"
	cfg.Middleware.Auth.SigningKey = "jwt-super-secret"
	cfg.DeFi.Graph.Endpoint = "https://gateway.thegraph.com/api/graph-super-secret/subgraphs/id/aave"
	cfg.DeFi.Graph.APIKey = "api-key-super-secret"
	cfg.Logger.Hooks = append(cfg.Logger.Hooks, &logging.HookConfig{
		Options: map[string]string{"DSN": "password=logger-super-secret"},
	})

	output := cfg.String()

	require.NotContains(t, output, "super-secret")
	require.NotContains(t, output, "jwt-super-secret")
	require.NotContains(t, output, "graph-super-secret")
	require.NotContains(t, output, "api-key-super-secret")
	require.NotContains(t, output, "logger-super-secret")
	require.True(t, strings.Contains(output, "[REDACTED]"))
}
