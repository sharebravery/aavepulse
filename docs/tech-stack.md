# AavePulse 技术栈

## 后端

- Go
- Gin
- GORM
- Casbin
- JWT
- Zap
- Swagger
- Wire
- `gin-admin-cli`：项目初始化及标准 CRUD 模块生成工具

## 数据层

- PostgreSQL：默认本地持久化层，存放协议配置、同步任务、快照、告警和审计数据
- Redis：可选缓存层，仅在后续明确需要缓存、游标或任务状态优化时启用

## 索引层

- The Graph：Aave 链上历史数据来源

## 部署方式

- 开发和演示阶段优先使用本地 Docker
- 后端和前端可以本地运行
- 未来如需公开部署，再切换到云上托管数据库
- Redis 不作为 MVP 的硬依赖

## 前端

- React
- Ant Design
- TradingView Lightweight Charts：展示 APY、利用率、供应量和借款量趋势
- Vite：前端开发与构建工具

## 工程约束

- 默认只读
- 不接触私钥和敏感凭据
- `.env` 只保留变量名示例，不提交真实值
- 博客草稿和过程性写作不进 Git
- Aave 业务模块必须接入模板现有认证、权限、日志和依赖注入体系
- 不重复实现模板已经提供的 JWT、RBAC、响应封装和数据库初始化

## 选择理由

- Go + Gin + GORM 适合快速落地后台骨架
- The Graph 适合做稳定的历史索引来源
- React + Ant Design 适合快速完成后台页面
- TradingView Lightweight Charts 能强化 DeFi 时间序列的展示效果，但不引入交易下单能力
- PostgreSQL 足以支撑 MVP 的配置、同步和聚合场景，Redis 只作为后续优化
