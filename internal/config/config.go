package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/jeremyzhou/aavepulse/pkg/encoding/json"
	"github.com/jeremyzhou/aavepulse/pkg/logging"
)

type Config struct {
	Logger     logging.LoggerConfig
	General    General
	Storage    Storage
	Middleware Middleware
	Util       Util
	Dictionary Dictionary
	DeFi       DeFi
}

type General struct {
	AppName            string `default:"aavepulse"`
	Version            string `default:"v0.1.0"`
	Debug              bool
	PprofAddr          string
	DisableSwagger     bool
	DisablePrintConfig bool
	DefaultLoginPwd    string `default:"6351623c8cef86fefabfa7da046fc619"` // MD5(abc-123)
	WorkDir            string // From command arguments
	MenuFile           string // From schema.Menus (JSON/YAML)
	DenyOperateMenu    bool
	HTTP               struct {
		Addr            string `default:":8040"`
		ShutdownTimeout int    `default:"10"` // seconds
		ReadTimeout     int    `default:"60"` // seconds
		WriteTimeout    int    `default:"60"` // seconds
		IdleTimeout     int    `default:"10"` // seconds
		CertFile        string
		KeyFile         string
	}
	Root struct {
		ID       string `default:"root"`
		Username string `default:"admin"`
		Password string
		Name     string `default:"Admin"`
	}
}

type Storage struct {
	Cache struct {
		Type      string `default:"memory"` // memory/badger/redis
		Delimiter string `default:":"`      // delimiter for key
		Memory    struct {
			CleanupInterval int `default:"60"` // seconds
		}
		Badger struct {
			Path string `default:"data/cache"`
		}
		Redis struct {
			Addr     string
			Username string
			Password string
			DB       int
		}
	}
	DB struct {
		Debug        bool
		Type         string `default:"sqlite3"`           // sqlite3/mysql/postgres
		DSN          string `default:"data/aavepulse.db"` // database source name
		MaxLifetime  int    `default:"86400"`             // seconds
		MaxIdleTime  int    `default:"3600"`              // seconds
		MaxOpenConns int    `default:"100"`               // connections
		MaxIdleConns int    `default:"50"`                // connections
		TablePrefix  string `default:""`
		AutoMigrate  bool
		PrepareStmt  bool
		Resolver     []struct {
			DBType   string   // sqlite3/mysql/postgres
			Sources  []string // DSN
			Replicas []string // DSN
			Tables   []string
		}
	}
}

type Util struct {
	Captcha struct {
		Length    int    `default:"4"`
		Width     int    `default:"400"`
		Height    int    `default:"160"`
		CacheType string `default:"memory"` // memory/redis
		Redis     struct {
			Addr      string
			Username  string
			Password  string
			DB        int
			KeyPrefix string `default:"captcha:"`
		}
	}
	Prometheus struct {
		Enable         bool
		Port           int    `default:"9100"`
		BasicUsername  string `default:"admin"`
		BasicPassword  string `default:"admin"`
		LogApis        []string
		LogMethods     []string
		DefaultCollect bool
	}
}

type Dictionary struct {
	UserCacheExp int `default:"4"` // hours
}

type DeFi struct {
	Demo     bool
	AutoSync bool
	Graph    struct {
		Endpoint    string
		APIKey      string
		MaxAttempts int `default:"3"`
		RetryDelay  int `default:"250"` // milliseconds
		Timeout     int `default:"15"`  // seconds
	}
}

func (c *Config) IsDebug() bool {
	return c.General.Debug
}

func (c *Config) String() string {
	safe := *c
	redact := func(value string) string {
		if value == "" {
			return ""
		}
		return "[REDACTED]"
	}
	safe.General.DefaultLoginPwd = redact(safe.General.DefaultLoginPwd)
	safe.General.Root.Password = redact(safe.General.Root.Password)
	safe.Storage.DB.DSN = redact(safe.Storage.DB.DSN)
	safe.Storage.Cache.Redis.Password = redact(safe.Storage.Cache.Redis.Password)
	safe.Middleware.Auth.SigningKey = redact(safe.Middleware.Auth.SigningKey)
	safe.Middleware.Auth.OldSigningKey = redact(safe.Middleware.Auth.OldSigningKey)
	safe.Middleware.Auth.Store.Redis.Password = redact(safe.Middleware.Auth.Store.Redis.Password)
	safe.Middleware.RateLimiter.Store.Redis.Password = redact(safe.Middleware.RateLimiter.Store.Redis.Password)
	safe.Util.Captcha.Redis.Password = redact(safe.Util.Captcha.Redis.Password)
	safe.Util.Prometheus.BasicPassword = redact(safe.Util.Prometheus.BasicPassword)
	safe.DeFi.Graph.Endpoint = redact(safe.DeFi.Graph.Endpoint)
	safe.DeFi.Graph.APIKey = redact(safe.DeFi.Graph.APIKey)
	safe.Logger.Hooks = make([]*logging.HookConfig, 0, len(c.Logger.Hooks))
	for _, hook := range c.Logger.Hooks {
		if hook == nil {
			continue
		}
		cloned := *hook
		cloned.Options = redactStringMap(hook.Options)
		cloned.Extra = redactStringMap(hook.Extra)
		safe.Logger.Hooks = append(safe.Logger.Hooks, &cloned)
	}

	b, err := json.MarshalIndent(&safe, "", "  ")
	if err != nil {
		panic("Failed to marshal config: " + err.Error())
	}
	return string(b)
}

func redactStringMap(values map[string]string) map[string]string {
	cloned := make(map[string]string, len(values))
	for key, value := range values {
		lowerKey := strings.ToLower(key)
		isSensitive := strings.Contains(lowerKey, "dsn") ||
			strings.Contains(lowerKey, "password") ||
			strings.Contains(lowerKey, "secret") ||
			strings.Contains(lowerKey, "token") ||
			strings.Contains(lowerKey, "key")
		if isSensitive && value != "" {
			cloned[key] = "[REDACTED]"
			continue
		}
		cloned[key] = value
	}
	return cloned
}

func (c *Config) PreLoad() {
	databaseType := os.Getenv("AAVEPULSE_DATABASE_TYPE")
	if databaseType != "" {
		c.Storage.DB.Type = databaseType
	}
	databaseDSN := os.Getenv("AAVEPULSE_DATABASE_DSN")
	if databaseDSN != "" {
		c.Storage.DB.DSN = databaseDSN
	}
	if databaseType != "" || databaseDSN != "" {
		for _, hook := range c.Logger.Hooks {
			if hook == nil || hook.Type != "gorm" {
				continue
			}
			if hook.Options == nil {
				hook.Options = make(map[string]string)
			}
			if databaseType != "" {
				hook.Options["DBType"] = databaseType
			}
			if databaseDSN != "" {
				hook.Options["DSN"] = databaseDSN
			}
		}
	}
	if value := os.Getenv("AAVEPULSE_GRAPH_ENDPOINT"); value != "" {
		c.DeFi.Graph.Endpoint = value
	}
	if value := os.Getenv("AAVEPULSE_GRAPH_API_KEY"); value != "" {
		c.DeFi.Graph.APIKey = value
	}
	if value := os.Getenv("AAVEPULSE_DEMO_MODE"); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			c.DeFi.Demo = parsed
		}
	}
	if value := os.Getenv("AAVEPULSE_JWT_SIGNING_KEY"); value != "" {
		c.Middleware.Auth.SigningKey = value
	}

	if addr := c.Storage.Cache.Redis.Addr; addr != "" {
		username := c.Storage.Cache.Redis.Username
		password := c.Storage.Cache.Redis.Password
		if c.Util.Captcha.CacheType == "redis" &&
			c.Util.Captcha.Redis.Addr == "" {
			c.Util.Captcha.Redis.Addr = addr
			c.Util.Captcha.Redis.Username = username
			c.Util.Captcha.Redis.Password = password
		}
		if c.Middleware.RateLimiter.Store.Type == "redis" &&
			c.Middleware.RateLimiter.Store.Redis.Addr == "" {
			c.Middleware.RateLimiter.Store.Redis.Addr = addr
			c.Middleware.RateLimiter.Store.Redis.Username = username
			c.Middleware.RateLimiter.Store.Redis.Password = password
		}
		if c.Middleware.Auth.Store.Type == "redis" &&
			c.Middleware.Auth.Store.Redis.Addr == "" {
			c.Middleware.Auth.Store.Redis.Addr = addr
			c.Middleware.Auth.Store.Redis.Username = username
			c.Middleware.Auth.Store.Redis.Password = password
		}
	}
}

func (c *Config) Print() {
	if c.General.DisablePrintConfig {
		return
	}
	fmt.Println("// ----------------------- Load configurations start ------------------------")
	fmt.Println(c.String())
	fmt.Println("// ----------------------- Load configurations end --------------------------")
}

func (c *Config) FormatTableName(name string) string {
	return c.Storage.DB.TablePrefix + name
}
