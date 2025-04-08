# AavePulse 架构

## 工程底座

后端必须由 `gin-admin-cli new` 基于 `gin-admin` 模板生成。模板提供启动命令、
配置加载、中间件、JWT、Casbin、审计日志、GORM、Swagger 和 Wire 依赖注入。
Aave 业务代码作为独立 `DEFI` 模块放在 `internal/mods/defi`，不得另起一套平行的
路由、认证或数据库初始化框架。

## 总体结构

系统按四层组织：

1. 数据接入层
2. 业务处理层
3. 管理控制层
4. 演示展示层

## 数据接入层

MVP 数据来源以 The Graph 为主，范围限定为 Aave V3 Ethereum 储备市场。查询适配器
遵循 Aave 官方 `protocol-subgraphs` V3 schema，读取 `reserves` 当前状态和
`reserveParamsHistoryItems` 参数历史，并在后端完成 token decimals、USD 价格以及
RAY APR 到 APY 的转换。
这一层的职责是：

- 拉取储备市场及其历史指标
- 维护增量同步游标
- 处理重试和失败记录
- 将原始结果写入本地存储

## 存储层

本地存储默认采用 PostgreSQL，Redis 仅作为可选缓存层。

- PostgreSQL 保存长期业务数据
- Redis 保存任务状态、缓存和短期游标，只有在后续确有需要时启用

The Graph 只负责查询，不承担持久化职责。

## 业务处理层

这一层不直接面向用户，而是负责把链上数据变成可展示指标。

MVP 包含的能力：

- 协议概览指标
- 储备市场列表和详情
- 时间序列快照
- 同步任务状态和执行历史

告警规则、钱包地址画像和多链聚合留到后续版本。

## 管理控制层

保留后台模板的核心后台能力：

- JWT 登录
- RBAC 权限控制
- 用户、角色、菜单管理
- 操作审计日志
- 同步任务管理

## 演示展示层

前端使用 React 做轻量仪表盘，不追求复杂交易终端。后台表格和表单使用 Ant
Design，协议指标趋势使用 TradingView Lightweight Charts。
页面重点是：

- 协议总览
- 储备市场列表
- 储备市场详情和 7/30/90 天指标趋势
- 同步状态

## 数据流

The Graph -> DEFI 同步服务 -> PostgreSQL -> DEFI 聚合 API -> React 页面

如果后续启用 Redis，则作为 PostgreSQL 之前或之后的缓存优化层。

## 边界

- 不做钱包签名
- 不读写私钥
- 不做真实链上交易
- 不做生产级复杂撮合或交易终端
- MVP 不做告警、多链和钱包地址画像
