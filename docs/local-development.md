# AavePulse 本地启动约定

## 开发方式

本地开发采用“基础设施容器化、应用本地运行”的方式：

- PostgreSQL：Docker 容器
- Redis：默认不启用，按需再加
- Go 后端：本地运行或后续容器化
- React 前端：本地运行

## 启动顺序

1. `docker compose up -d postgres` 启动数据库。
2. `pnpm --dir web install` 安装前端依赖。
3. `pnpm --dir web build` 生成后端可托管的静态文件。
4. `make start` 启动后端和静态站点。
5. 打开 `http://localhost:8040`，使用 `admin / abc-123` 登录。
6. 检查概览、储备详情、趋势图和同步记录。

说明：MVP 阶段实际只要求启动数据库，缓存层后续按需补充。

## 配置约定

- 后端沿用 `gin-admin` 的 TOML 配置体系，敏感值允许由环境变量覆盖
- 使用 `.env.example` 说明前端和 Docker Compose 需要的变量
- 不提交真实密钥、真实 RPC、真实数据库地址
- 所有对外服务地址都通过环境变量注入

支持的后端覆盖变量：

- `AAVEPULSE_DATABASE_TYPE`
- `AAVEPULSE_DATABASE_DSN`
- `AAVEPULSE_DEMO_MODE`
- `AAVEPULSE_GRAPH_ENDPOINT`
- `AAVEPULSE_GRAPH_API_KEY`
- `AAVEPULSE_JWT_SIGNING_KEY`

Vite 使用仓库根目录的 `VITE_API_BASE_URL`。本地开发不设置时使用 `/api/v1`。

## 本地检查点

- 后端能连上 PostgreSQL
- 任务调度能正常跑起来
- The Graph 查询返回的数据能落库
- React 页面能读到聚合 API

## 工具要求

- Go 版本以模板 `go.mod` 为准
- `gin-admin-cli/v10` 用于项目初始化和标准模块生成
- Wire 用于更新依赖注入代码
- Swag 用于更新 Swagger 文档
- Node.js 与包管理器用于运行 React 前端

`gin-admin-cli` 是工程辅助工具，不是线上运行依赖。手写查询、同步和聚合逻辑
仍放在模板模块分层中，不强行套用 CRUD 生成器。

## 失败处理

- 数据库启动失败时先检查端口占用和容器状态
- 如果 Redis 未启用，不影响 MVP 启动和验证
- Graph 请求失败时记录错误并做重试
- 前端请求失败时显示空状态和错误提示

## 测试命令

```bash
go test ./...
go vet ./...
go build ./...
pnpm --dir web test
pnpm --dir web build
```
