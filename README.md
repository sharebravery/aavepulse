# AavePulse

AavePulse 是一个基于 Go 的只读 Aave V3 数据监控后台，使用 The Graph 同步储备市场
数据，并通过 React 仪表盘展示协议概览和历史趋势。

## 功能

- 提供登录、RBAC、审计、Swagger 和 Wire 依赖注入能力
- 通过 The Graph 接入 Aave V3 Ethereum 储备市场数据
- 将当前市场、90 天快照和同步记录持久化到 PostgreSQL
- 展示供应量、借款量、可用流动性、资金利用率和 APY
- 使用 TradingView Lightweight Charts 展示流动性和利率趋势
- 支持手动同步、幂等写入、有限重试和同步执行审计
- 提供显式 Demo 模式，无外部 API Key 也能完整演示

## 技术栈

- 后端：Go、Gin、GORM、Casbin、JWT、Wire、Swagger
- 数据：PostgreSQL、The Graph GraphQL
- 前端：React 19、TypeScript、Vite、Tailwind CSS、Radix UI、Lightweight Charts
- 工程：Docker Compose、Vitest

## 快速开始

环境要求：Go 1.19+、Node.js 22+、pnpm 10+、Docker Compose。

```bash
# 1. 启动 PostgreSQL
docker compose up -d postgres

# 2. 安装并构建前端
pnpm --dir web install
pnpm --dir web build

# 3. 启动后端，同时托管 web/dist
make start
```

打开 `http://localhost:8040`，使用演示账户登录：

```text
用户名：admin
密码：abc-123
```

默认开启 Demo 模式，首次启动会自动生成 6 个储备市场和 90 天历史快照。
Redis 不需要启动。

## 开发模式

```bash
# 终端 1：PostgreSQL
make deps-up

# 终端 2：Go API
make start

# 终端 3：Vite 开发服务器
make web-dev
```

Vite 地址为 `http://localhost:5173`，`/api` 请求会代理到 `localhost:8040`。

## 使用 The Graph

真实 Graph 模式不允许静默回退为 Demo 数据。项目只读取进程环境变量，不会自动加载 `.env`，所以本地可以先执行：

```bash
set -a
source .env
set +a
```

然后在 `.env` 中配置：

```bash
AAVEPULSE_DEMO_MODE=false
AAVEPULSE_GRAPH_ENDPOINT=https://gateway.thegraph.com/api/subgraphs/id/Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g
AAVEPULSE_GRAPH_API_KEY=<THE_GRAPH_API_KEY>
AAVEPULSE_JWT_SIGNING_KEY=<LOCAL_RANDOM_VALUE>
```

`.env` 已被 Git 忽略，不要提交 API Key、数据库密码、Token、钱包私钥或其他敏感值。

## 验证

```bash
go test ./...
go vet ./...
go build ./...
pnpm --dir web test
pnpm --dir web build
```

Swagger：`http://localhost:8040/swagger/index.html`

## 目录

```text
internal/mods/rbac   登录、权限和审计模块
internal/mods/defi   Aave 数据接入、持久化、同步、聚合和 API
configs              TOML 配置、Casbin 模型和菜单资源
web                  React 仪表盘
```

## 许可证

项目使用 Apache-2.0 许可证，许可证说明见 [LICENSE](./LICENSE)。
