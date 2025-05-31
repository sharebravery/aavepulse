# AavePulse 需求规格

## 1. 产品定义

AavePulse 是一个只读 Aave V3 数据监控后台。它通过 The Graph 获取 Ethereum
主网上的储备市场数据，在本地 PostgreSQL 中形成可重复查询的当前状态和历史快照，
再由受权限保护的 API 和 React 页面展示。

项目用于开源演示和技术博客配套，不承担资产托管、交易、投顾或生产告警职责。

## 2. MVP 范围

### 2.1 身份与权限

- 保留 `gin-admin` 的登录、JWT、用户、角色、菜单和 Casbin RBAC。
- Aave 数据查询权限与同步执行权限分开配置。
- 手动触发同步必须写入模板现有操作日志。

### 2.2 协议概览

概览页展示以下聚合指标：

- 总供应量（USD）
- 总借款量（USD）
- 可用流动性（USD）
- 整体资金利用率
- 储备市场数量
- 最近一次成功同步时间

### 2.3 储备市场

列表至少展示：资产符号、资产名称、供应量、借款量、可用流动性、资金利用率、
供应 APY、浮动借款 APY、价格和更新时间。

列表支持按资产符号搜索，并支持按供应量、借款量、利用率和 APY 排序。

详情页展示单个储备市场的当前指标和 7 天、30 天、90 天历史趋势。趋势图使用
TradingView Lightweight Charts 的折线或面积图，不使用 K 线伪装非价格指标。

### 2.4 数据同步

- 从可配置的 The Graph GraphQL Endpoint 拉取 Aave V3 Ethereum 数据。
- Graph Gateway API Key 通过独立 Bearer 配置注入，不嵌入 Endpoint 或日志。
- 支持后台手动触发同步，并防止同一协议并发重复执行。
- 同步写入必须幂等，单批次数据使用数据库事务处理。
- 每次同步记录状态、耗时、读取数、写入数和错误摘要。
- 网络错误应有有限次数重试和超时，不允许无限重试。
- 提供显式 `demo` 数据模式用于本地演示；不得在真实 Graph 请求失败时静默伪装成真实数据。

### 2.5 前端

- 登录页复用模板认证接口。
- 页面至少包含协议概览、储备市场、储备详情和同步记录。
- 使用 Tailwind CSS + Radix UI 构建 DeFi 终端界面，使用 TradingView Lightweight Charts 绘制趋势。
- 桌面端为主要演示环境，同时保证移动端可查看核心指标。
- API 失败、无数据和同步中必须有明确状态提示。

### 2.6 API 契约

DEFI 模块统一挂载在模板的 `/api/v1/defi` 路由下：

- `GET /overview`：返回协议聚合指标和最近同步状态。
- `GET /reserves`：分页查询储备市场，支持 `symbol`、`order_by` 和 `order`。
- `GET /reserves/:id`：返回单个储备市场当前状态。
- `GET /reserves/:id/snapshots`：按 `range=7d|30d|90d` 返回时间序列。
- `GET /sync-runs`：分页查询同步执行记录。
- `POST /sync-runs`：创建一次手动同步，重复执行时返回明确冲突状态。

除登录接口外，上述接口都必须经过模板 JWT 认证。读取接口和执行同步接口分别绑定
Casbin 资源，错误响应沿用模板格式。

## 3. 后端工程要求

- 后端必须通过 `gin-admin-cli` 基于 `gin-admin` 初始化。
- Aave 业务代码放入 `internal/mods/defi`，遵循模板的 `schema/dal/biz/api` 分层。
- 新模块接入模板现有的 GORM、Wire、Swagger、日志、错误和响应封装。
- 标准 CRUD 可使用 `gin-admin-cli gen` 生成；Graph 查询、同步编排和聚合查询手写实现。
- 不保留上一版自建的 `cmd/aavepulse`、`internal/httpapi` 等平行骨架。

## 4. 数据要求

- PostgreSQL 是 MVP 的唯一必需数据库。
- Redis 默认不启用，MVP 不能依赖 Redis 才能启动。
- 所有金额、价格和利率使用定点数保存，并在 API 层明确单位。
- USD 金额通过字符串形式的十进制定点数返回，APY 和利用率以 `0-1` 比例返回。
- 时间统一存储为 UTC，前端按浏览器时区显示。
- Graph Endpoint、数据库密码等配置不得硬编码或提交真实值。

## 5. 非功能要求

- 后端启动、数据库迁移、数据同步和核心聚合逻辑必须有自动化测试。
- `go test ./...` 和前端构建必须通过。
- Docker Compose 一条命令启动 PostgreSQL。
- README 提供从克隆到看到页面的最短运行路径。
- 日志不得输出密码、Token、Graph API Key 或其他敏感值。

## 6. 非目标

- 钱包连接、消息签名和私钥管理
- 存款、借款、还款、清算或任何链上写操作
- TradingView 完整交易终端或下单组件
- 多链聚合、地址画像、生产级告警和实时 WebSocket
- 将博客正文、草稿或私有部署配置提交到仓库

## 7. MVP 验收标准

1. 本地 PostgreSQL 启动后，后端可完成迁移并使用默认管理员登录。
2. 在 `demo` 模式下，无外部密钥也能同步一组明确标记的演示数据。
3. 配置有效 Graph Endpoint 后，可以同步 Aave V3 Ethereum 储备市场数据。
4. 概览和储备列表 API 返回数据库中的聚合结果，不直接透传 GraphQL 响应。
5. 前端可以查看概览、储备列表、历史趋势和同步记录。
6. 不启用 Redis 时，所有 MVP 功能正常运行。
7. 项目中不存在旧应用名、旧模块路径和模板演示素材；许可证声明除外。

## 8. P1 候选范围

- 告警规则和告警事件
- 定时同步和失败通知
- Aave 多网络切换
- Redis 缓存和分布式任务锁
- 更完整的协议风险指标
