# gin-admin 模板迁移规范

## 1. 结论

AavePulse 后端不使用自建 Gin 骨架。项目必须通过 `gin-admin-cli/v10` 从
`LyricTian/gin-admin` 的 `main` 分支生成，再在模板模块体系内增加 DEFI 业务。

## 2. 初始化方式

执行阶段使用类似下面的命令在临时目录生成项目，确认结果后再替换当前后端代码：

```bash
gin-admin-cli new \
  --dir <temporary-parent> \
  --name aavepulse \
  --app-name aavepulse \
  --desc "A read-only Aave V3 data monitoring service" \
  --version v0.1.0 \
  --pkg github.com/<owner>/aavepulse \
  --git-url https://github.com/LyricTian/gin-admin.git \
  --git-branch main
```

`<owner>` 在正式初始化前替换为目标 GitHub 用户或组织。不要为了暂时通过编译而使用
无效的仓库路径。

## 3. CLI 使用边界

适合使用 `gin-admin-cli` 的场景：

- 初始化项目并替换应用名、版本、描述和 Go module
- 为协议配置、储备市场、快照、同步记录生成标准 `schema/dal/biz/api` 骨架
- 更新 Wire 依赖注入和 Swagger 文档

不适合直接依赖生成器完成的场景：

- GraphQL 客户端和 The Graph 数据映射
- 增量同步、重试、事务和并发控制
- 协议概览聚合和时间序列查询
- TradingView 图表数据适配

这些逻辑应手写并接受针对性测试。

## 4. 模板保留项

- `cmd` 启停和版本命令
- `internal/bootstrap` 启动流程
- `internal/config` TOML 配置体系
- `internal/mods/rbac` 登录、用户、角色、菜单和审计日志
- `internal/wirex` Wire 依赖注入
- `pkg` 中实际被项目依赖的日志、JWT、中间件、错误和 GORM 工具
- Swagger 支持和统一 API 响应

## 5. 模板清理项

- 上游 README、英文 README、演示截图、二维码和无关宣传信息
- `ginadmin` 应用名、数据库名、构建产物名和 Swagger 标题
- `github.com/LyricTian/gin-admin/v10` 业务导入路径
- 未被项目使用且确认无依赖的邮件、对象存储等能力
- 模板默认 SQLite 配置，改为本地 Docker PostgreSQL

清理必须基于依赖检查，不能为了目录更少而破坏模板启动链路。

## 6. 许可证和署名

项目品牌与产品文档不沿用模板作者信息，但派生代码仍需遵守上游 Apache-2.0
许可证。`gin-admin-cli new` 当前会删除模板 `LICENSE`，因此执行迁移时必须主动恢复
Apache-2.0 许可证和上游版权声明，并按需增加 `NOTICE` 说明派生关系。

这类法定声明不属于需要清理的产品品牌信息。

## 7. 前端策略

MVP 前端独立放在 `web` 目录。可以参考 `gin-admin-frontend` 的认证协议和后台布局，
但页面围绕 AavePulse 重新设计。是否通过 CLI 的 `--fe-dir` 拉取完整前端模板，要以
依赖体积和清理成本为判断标准；默认优先建立精简 React 前端并复用后端认证接口。

## 8. 迁移验收

- Git 历史不携带上游仓库的 `.git` 目录
- Go module、应用名、二进制名和配置统一为 AavePulse
- 后端目录结构可以明确追溯到 `gin-admin`
- 登录、RBAC、审计、Swagger 和 Wire 正常工作
- PostgreSQL 为默认数据库，Redis 保持可选
- 上一版自建后端代码已删除
- 上游许可证义务得到保留

## 9. 当前代码处理

当前目录中的 `cmd/aavepulse`、`internal/app`、`internal/graph`、`internal/httpapi`、
`internal/model`、`internal/service`、`internal/storage` 以及对应的 `go.mod`、`go.sum`
来自上一版自建实现。执行迁移时应整体删除，由 CLI 生成的模板文件替换；规划文档、
工作区约束文件和非项目工具元数据不参与这次删除。
