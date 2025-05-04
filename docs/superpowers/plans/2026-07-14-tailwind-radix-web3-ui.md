# Tailwind Radix Web3 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** 将 AavePulse 前端从 Ant Design 传统后台视觉迁移为 Tailwind CSS v4 + Radix UI 驱动的 DeFi 专业终端，同时保持现有 API、认证、数据加载和 TradingView 功能不变。

**Architecture:** Tailwind 负责布局、主题 Token 和状态样式，Radix UI 负责 Select、Tabs、Tooltip、Dialog/Sheet 等可访问交互原语，项目内维护轻量的 `components/ui` 包装层。页面只负责数据加载和业务事件，展示组件负责资产标识、指标、状态和利用率视觉编码。完成迁移后移除 Ant Design，避免两套视觉系统并存。

**Tech Stack:** React 19、TypeScript、Vite、Tailwind CSS v4、`@tailwindcss/vite`、Radix UI、Lucide React、Lightweight Charts、Vitest、Testing Library。

## Global Constraints

- 现有 `web/src/lib/client.ts`、认证协议、API 路径和类型契约保持不变。
- 不增加钱包连接、签名、交易或任何链上写入能力。
- PostgreSQL、Go 后端和 TradingView 数据接口不修改。
- 桌面主要演示宽度为 1440px，移动验收宽度为 390px。
- 页面必须持续区分 `DEMO DATA` 与 `THE GRAPH` 数据来源。
- 使用深色 DeFi 终端视觉，不复制 shadcn 默认 SaaS 外观。
- 生产代码改动前先为新的纯展示行为添加失败测试；仅依赖配置和生成文件的步骤除外。
- 保留用户已有的 `README.md` 未提交修改，不把它纳入本次提交。

## File Map

- Modify: `web/package.json`、`web/pnpm-lock.yaml`、`web/vite.config.ts`、`web/tsconfig.app.json`
- Create: `web/src/lib/utils.ts`、`web/src/lib/design.ts`
- Create: `web/src/components/ui/button.tsx`、`web/src/components/ui/input.tsx`、`web/src/components/ui/badge.tsx`、`web/src/components/ui/select.tsx`、`web/src/components/ui/tabs.tsx`、`web/src/components/ui/tooltip.tsx`、`web/src/components/ui/skeleton.tsx`
- Create: `web/src/components/TokenOrb.tsx`、`web/src/components/MetricCard.tsx`、`web/src/components/StatusPill.tsx`、`web/src/components/UtilizationBar.tsx`、`web/src/components/ProtocolStatusBar.tsx`、`web/src/components/PageIntro.tsx`
- Modify: `web/src/App.tsx`、`web/src/main.tsx`、`web/src/styles.css`
- Modify: `web/src/pages/LoginPage.tsx`、`web/src/pages/Dashboard.tsx`、`web/src/pages/OverviewPage.tsx`、`web/src/pages/ReservesPage.tsx`、`web/src/pages/ReserveDetailPage.tsx`、`web/src/pages/SyncRunsPage.tsx`、`web/src/components/TrendChart.tsx`
- Create: `web/src/lib/design.test.ts`、`web/src/components/TokenOrb.test.tsx`、`web/src/components/UtilizationBar.test.tsx`

### Task 1: Establish Tailwind and Radix Foundation

**Files:**

- Modify: `web/package.json`, `web/vite.config.ts`, `web/tsconfig.app.json`, `web/src/main.tsx`, `web/src/styles.css`
- Create: `web/src/lib/utils.ts`
- Test: `web/src/lib/design.test.ts`

**Dependencies:** add `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-dialog`; keep `lucide-react` and `lightweight-charts`.

- [ ] **Step 1: Add the failing design-token test.** Assert that `formatTokenSymbol('USDC')` returns `USDC`, long symbols are truncated to the documented display length, and `getUtilizationTone` maps below-60%, 60-80%, and above-80% to `mint`, `blue`, and `amber`.
- [ ] **Step 2: Run `pnpm --dir web test src/lib/design.test.ts` and confirm it fails because `web/src/lib/design.ts` does not exist.**
- [ ] **Step 3: Install the dependencies and configure the Vite Tailwind plugin.** Add `tailwindcss()` after `react()` in `vite.config.ts`, add the `@/*` path alias in both TypeScript compiler configurations, and implement `cn(...inputs)` in `lib/utils.ts` using `clsx` and `tailwind-merge`.
- [ ] **Step 4: Replace the global stylesheet with `@import "tailwindcss"` and the AavePulse theme.** Define `--void`, `--surface`, `--surface-raised`, `--line`, `--text`, `--muted`, `--blue`, `--cyan`, `--mint`, `--amber`, and `--danger`; include the responsive breakpoints and reduced-motion rule from the approved design.
- [ ] **Step 5: Implement `design.ts` and run `pnpm --dir web test src/lib/design.test.ts`.** Confirm the new token test passes, then run `pnpm --dir web build` and confirm the Tailwind Vite pipeline emits `web/dist` successfully.
- [ ] **Step 6: Commit the foundation.**

```bash
git add web/package.json web/pnpm-lock.yaml web/vite.config.ts web/tsconfig.app.json web/src/main.tsx web/src/styles.css web/src/lib/utils.ts web/src/lib/design.ts web/src/lib/design.test.ts
git commit -m "refactor(web): add tailwind radix foundation"
```

### Task 2: Build the Local UI Primitives and Data Visual Components

**Files:**

- Create: `web/src/components/ui/button.tsx`, `input.tsx`, `badge.tsx`, `select.tsx`, `tabs.tsx`, `tooltip.tsx`, `skeleton.tsx`
- Create: `web/src/components/TokenOrb.tsx`, `MetricCard.tsx`, `StatusPill.tsx`, `UtilizationBar.tsx`, `ProtocolStatusBar.tsx`, `PageIntro.tsx`
- Create: `web/src/components/TokenOrb.test.tsx`, `UtilizationBar.test.tsx`

**Interfaces:**

- `TokenOrb({ symbol, size?: 'sm' | 'md' | 'lg' })` renders a deterministic symbol-based orb with accessible text.
- `MetricCard({ label, value, detail, icon, tone, featured? })` renders a metric card without API access.
- `StatusPill({ label, tone, icon? })` renders `demo`, `graph`, `success`, `running`, `warning`, or `error` states.
- `UtilizationBar({ value, showValue?, className? })` accepts a `0-1` ratio and clamps display to `0-100%`.
- `ProtocolStatusBar({ demo, lastSyncedAt })` renders network, source, sync time, and read-only state.
- `PageIntro({ eyebrow, title, description, actions? })` renders a common page header.

- [ ] **Step 1: Write tests for deterministic Token Orb classes and utilization clamping.** Test equal symbols produce equal classes, empty symbols remain accessible, values below zero render 0%, and values above one render 100%.
- [ ] **Step 2: Run the two component tests and confirm the expected missing-module failures.**
- [ ] **Step 3: Implement the Radix-backed primitives.** Use `@radix-ui/react-select` for sorting controls, `@radix-ui/react-tabs` for detail mode/range controls, `@radix-ui/react-tooltip` for truncated error text and contract addresses, and `@radix-ui/react-dialog` for the mobile navigation sheet.
- [ ] **Step 4: Implement the pure display components with Tailwind classes and the approved radius/color tokens.** No component may import `api`, `antd`, or read browser storage.
- [ ] **Step 5: Run component tests and `pnpm --dir web build`; confirm both pass.**
- [ ] **Step 6: Commit the primitives.**

```bash
git add web/src/components web/src/lib/design.test.ts web/src/components/TokenOrb.test.tsx web/src/components/UtilizationBar.test.tsx
git commit -m "feat(web): add defi ui primitives"
```

### Task 3: Rebuild the Shell and Login Experience

**Files:**

- Modify: `web/src/App.tsx`, `web/src/pages/Dashboard.tsx`, `web/src/pages/LoginPage.tsx`, `web/src/styles.css`
- Use: `web/src/components/ui/*`, `ProtocolStatusBar`, `StatusPill`, `PageIntro` where applicable

- [ ] **Step 1: Replace Ant Design imports in `App.tsx` and configure only the local theme.** Remove `ConfigProvider`; preserve the authenticated state and `onLogout` behavior exactly.
- [ ] **Step 2: Rebuild `Dashboard.tsx` as a responsive shell.** Desktop uses a 24px rounded floating sidebar, network context, icon navigation, read-only footer, and a workspace status bar. Mobile uses a Radix Dialog sheet and bottom navigation; preserve the existing `View` and selected reserve state.
- [ ] **Step 3: Rebuild `LoginPage.tsx` with native form semantics and local UI primitives.** Keep `api.captcha`, `api.captchaImage`, `api.login`, initial demo credentials, error reload, and loading behavior. Use a protocol-orbit background, floating panel, Radix tooltip for captcha refresh, and accessible labels.
- [ ] **Step 4: Run existing auth/client tests and build.** Command: `pnpm --dir web test && pnpm --dir web build`; expected result is zero failures and a generated `web/dist`.
- [ ] **Step 5: Commit the shell and login.**

```bash
git add web/src/App.tsx web/src/pages/Dashboard.tsx web/src/pages/LoginPage.tsx web/src/styles.css
git commit -m "feat(web): redesign shell and login"
```

### Task 4: Rebuild Overview, Reserves, Sync, and Detail Pages

**Files:**

- Modify: `web/src/pages/OverviewPage.tsx`, `web/src/pages/ReservesPage.tsx`, `web/src/pages/ReserveDetailPage.tsx`, `web/src/pages/SyncRunsPage.tsx`, `web/src/components/TrendChart.tsx`, `web/src/styles.css`

- [ ] **Step 1: Replace Overview Ant Design tables/cards with Bento metrics, `MetricCard`, asset rows, `TokenOrb`, `UtilizationBar`, and `StatusPill`.** Keep `api.overview`, `api.reserves`, `api.syncRuns`, `api.runSync`, loading, error, and success-message behavior. Use a local toast/status region instead of Ant Design `message`.
- [ ] **Step 2: Replace the Reserves table with a responsive asset list.** Desktop keeps high-density comparison columns; mobile renders asset cards. Use Radix Select for `orderBy`, native search input, tooltip for long values, and preserve server-side filtering and pagination behavior.
- [ ] **Step 3: Replace the Reserve Detail controls with Radix Tabs and Segmented-style buttons.** Preserve `range`, `mode`, snapshot loading, errors, and the lazy-loaded chart. Show address tooltip, risk-colored utilization, and APY status pills.
- [ ] **Step 4: Replace the Sync Runs table with a timeline-like responsive list.** Preserve `api.syncRuns`, `api.runSync`, status, source, timestamps, counts, error summary, and duplicate-submit protection.
- [ ] **Step 5: Update `TrendChart.tsx` to the dark theme.** Use `#0B1022` plot background, `#1B2440` grid, `#37D7FF` supply line, `#4EF2C2` borrow line, muted labels, responsive height, and keep the existing cleanup/ResizeObserver behavior.
- [ ] **Step 6: Run `pnpm --dir web test && pnpm --dir web build`.** Confirm no Ant Design imports remain with `rg -n "from 'antd'|from \"antd\"" web/src` returning no matches.
- [ ] **Step 7: Commit the data pages.**

```bash
git add web/src/pages web/src/components/TrendChart.tsx web/src/styles.css
git commit -m "feat(web): redesign defi data views"
```

### Task 5: Browser Verification and Cleanup

**Files:**

- Modify: `web/package.json`, `web/pnpm-lock.yaml`, `README.md` only if the frontend setup command changes
- Verify: all files under `web/src`

- [ ] **Step 1: Run `pnpm --dir web test`, `pnpm --dir web build`, and `go test ./...`.** All commands must exit with code 0.
- [ ] **Step 2: Start the local stack with `docker compose up -d postgres`, build the frontend, and run `make start`.** Confirm `http://localhost:8040/` and `/swagger/index.html` return HTTP 200.
- [ ] **Step 3: Use browser automation at 1440x1000.** Verify login, overview metrics, reserve list search/sort, USDC detail, 30d/90d and liquidity/rates switches, TradingView chart rendering, sync page, logout, and no browser console errors.
- [ ] **Step 4: Use browser automation at 390px width.** Verify bottom navigation, login form, metric cards, asset cards, chart controls, and that no horizontal overflow occurs.
- [ ] **Step 5: Inspect `git diff --check`, `git status`, and `rg -n "antd|AavePulse.*paper|metric-index|nav-index" web/src`.** Remove unused Ant Design packages, old paper-style selectors, and temporary screenshots before final handoff.
- [ ] **Step 6: Commit dependency cleanup and documentation updates.**

```bash
git add web/package.json web/pnpm-lock.yaml README.md
git commit -m "chore(web): remove ant design dependency"
```

## Verification Matrix

| Requirement | Evidence |
| --- | --- |
| Tailwind/Radix foundation | Vite build and primitive tests |
| No traditional Ant Design appearance | no `antd` imports/dependency; desktop screenshot inspection |
| Authentication unchanged | existing auth tests and browser login |
| API/data behavior unchanged | existing client tests and browser pages populated from API |
| TradingView preserved | detail screenshot with rendered chart and both modes |
| Responsive behavior | 1440px and 390px browser screenshots, overflow check |
| Error/loading states | component/page tests plus API failure state inspection |
