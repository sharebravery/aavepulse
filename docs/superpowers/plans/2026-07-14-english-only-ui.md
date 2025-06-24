# English-Only UI Implementation Plan

**Status:** Implementation completed; final verification is recorded in the handoff.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AavePulse 前端所有用户可见内容统一为英文，并保持现有 Tailwind/Radix DeFi 终端视觉、认证、数据和图表行为不变。

**Architecture:** 创建轻量的静态 `copy` 模块集中管理英文文案和状态映射；页面只读取文案和格式化函数，不再内嵌中文或 API 内部状态值。统一格式化层使用 `en-US` 的 `Intl.NumberFormat` 和 `Intl.DateTimeFormat`，错误展示使用英文兜底映射。

**Tech Stack:** React 19、TypeScript、Tailwind CSS v4、Radix UI、Vitest、Testing Library、TradingView Lightweight Charts。

## Global Constraints

- 不引入 i18n 框架、语言切换控件或多语言资源目录。
- 所有用户可见文案必须为英文，内部变量名、API 字段名和代码注释不在此范围内。
- 日期、金额、数量和百分比必须使用 `en-US` 展示格式。
- 不修改后端 API、认证协议、演示数据模式、只读约束和图表数据行为。
- 未知后端错误不直接展示原始文本；开发环境允许通过 `console.error` 保留诊断信息。
- 每个行为改动先添加失败测试，再写最小实现。

## File Map

- Create: `web/src/lib/copy.ts`，集中英文文案、状态/来源映射和英文错误兜底。
- Modify: `web/src/lib/format.ts`，统一 `en-US` 日期、金额、数量和百分比格式。
- Modify: `web/index.html`，声明英文页面语言和深色主题色。
- Test: `web/src/lib/copy.test.ts`、`web/src/lib/format.test.ts`。
- Modify: `web/src/pages/LoginPage.tsx`、`web/src/pages/Dashboard.tsx`、`web/src/components/ProtocolStatusBar.tsx`、`web/src/components/TrendChart.tsx`、`web/src/components/UtilizationBar.tsx`。
- Modify: `web/src/pages/OverviewPage.tsx`、`web/src/pages/ReservesPage.tsx`、`web/src/pages/ReserveDetailPage.tsx`、`web/src/pages/SyncRunsPage.tsx`。

### Task 1: Add the English Copy and Formatting Layer

**Files:**

- Create: `web/src/lib/copy.ts`
- Modify: `web/src/lib/format.ts`
- Test: `web/src/lib/copy.test.ts`, `web/src/lib/format.test.ts`

**Interfaces:**

- `copy`: immutable groups `common`, `auth`, `dashboard`, `overview`, `reserves`, `detail`, and `sync`.
- `statusLabel(status: string): string`: maps `succeeded`, `failed`, `running`, `idle`, and unknown values to safe English labels.
- `sourceLabel(source: string): string`: maps `demo` to `Demo index`, `graph` to `The Graph`, and unknown values to `External index`.
- `errorMessage(cause: unknown, fallback: string): string`: returns an English known-error message or the supplied fallback; logs the original error only in development.
- `formatCurrency(value: string | number): string`, `formatNumber(value: string | number): string`, `formatPercent(value: string | number): string`, `formatDateTime(value?: string): string` all use stable `en-US` output.

- [ ] **Step 1: Add failing tests for copy and formatting behavior.**

```ts
it('maps internal statuses and sources to product labels', () => {
  expect(statusLabel('succeeded')).toBe('Succeeded')
  expect(statusLabel('unknown')).toBe('Unknown')
  expect(sourceLabel('demo')).toBe('Demo index')
})

it('formats values with the English locale', () => {
  expect(formatCurrency('4200000')).toBe('$4.20M')
  expect(formatNumber(1234567)).toBe('1,234,567')
  expect(formatPercent('0.041')).toBe('4.10%')
  expect(formatDateTime('2026-07-14T08:05:00Z')).toMatch(/07\/14|14\/07/)
})
```

- [ ] **Step 2: Run the focused tests and confirm the new exports or English behavior are missing.**

Run: `pnpm --dir web test src/lib/copy.test.ts src/lib/format.test.ts`

Expected: FAIL because `copy.ts` exports do not exist and the current date fallback is Chinese.

- [ ] **Step 3: Implement `copy.ts` and update `format.ts`.** Use literal English copy groups, explicit status/source maps, and `Intl.NumberFormat('en-US')` / `Intl.DateTimeFormat('en-US')`. Keep compact currency output (`$4.20M`) compatible with the existing dashboard.

- [ ] **Step 4: Run the focused tests and verify they pass.**

Run: `pnpm --dir web test src/lib/copy.test.ts src/lib/format.test.ts`

Expected: all focused tests pass.

- [ ] **Step 5: Commit the language foundation.**

```bash
git add web/src/lib/copy.ts web/src/lib/copy.test.ts web/src/lib/format.ts web/src/lib/format.test.ts
git commit -m "refactor(web): add english copy layer"
```

### Task 2: Localize Authentication and Application Shell

**Files:**

- Modify: `web/src/pages/LoginPage.tsx`, `web/src/pages/Dashboard.tsx`, `web/src/components/ProtocolStatusBar.tsx`, `web/src/components/TrendChart.tsx`, `web/src/components/UtilizationBar.tsx`
- Test: existing component tests plus `web/src/lib/copy.test.ts`

**Interfaces:** Consume `copy`, `statusLabel`, `sourceLabel`, `errorMessage`, and the `en-US` formatters from Task 1. Do not change `api`, auth token storage, component props, or route state.

- [ ] **Step 1: Replace LoginPage Chinese strings and raw exception messages.** Use English labels such as `Username`, `Password`, `Captcha`, `Refresh captcha`, `Sign in`, `Signing in...`, `Invalid credentials or captcha`, and `Unable to load captcha`. Keep `admin / abc-123` as the local demo credential and preserve captcha refresh behavior.

- [ ] **Step 2: Replace Dashboard and ProtocolStatusBar strings.** Translate navigation aria labels, `Index healthy`, `LIVE`, `Sign out`, `Session`, `Read-only operator`, `local demo`, `Demo index`, `The Graph`, and `Synced`. Keep the desktop sidebar, mobile bottom navigation, and Radix Dialog unchanged structurally.

- [ ] **Step 3: Replace accessibility labels in chart and utilization components.** Use `APY history chart`, `Supply and borrow history chart`, and `Utilization` without changing chart series or progress calculations.

- [ ] **Step 4: Run frontend tests and search for remaining Chinese in shell/auth files.**

Run: `pnpm --dir web test && rg -n "[\\p{Han}]" web/src/pages/LoginPage.tsx web/src/pages/Dashboard.tsx web/src/components/ProtocolStatusBar.tsx web/src/components/TrendChart.tsx web/src/components/UtilizationBar.tsx`

Expected: tests pass and the `rg` command returns no matches.

- [ ] **Step 5: Commit the shell localization.**

```bash
git add web/src/pages/LoginPage.tsx web/src/pages/Dashboard.tsx web/src/components/ProtocolStatusBar.tsx web/src/components/TrendChart.tsx web/src/components/UtilizationBar.tsx
git commit -m "feat(web): localize auth and shell in english"
```

### Task 3: Localize DeFi Data Pages and Internal Status Values

**Files:**

- Modify: `web/src/pages/OverviewPage.tsx`, `web/src/pages/ReservesPage.tsx`, `web/src/pages/ReserveDetailPage.tsx`, `web/src/pages/SyncRunsPage.tsx`
- Test: `web/src/lib/copy.test.ts`, existing page/component tests

**Interfaces:** Keep existing API calls, loading states, error states, query parameters, selected reserve behavior, sync behavior, and chart mode/range values unchanged. Use `statusLabel` and `sourceLabel` for every API enum shown to users.

- [ ] **Step 1: Localize OverviewPage.** Replace Chinese headings, metric details, market labels, pipeline labels, retry action, sync feedback, empty/error text, and count suffixes with English copy. Use `formatNumber` for reserve counts and written counts; use `sourceLabel` for the latest source.

- [ ] **Step 2: Localize ReservesPage.** Replace search placeholder, aria labels, sorting options, table headers, mobile labels, empty state, and API error fallback. Preserve server-side `symbol`, `order_by`, and `order` query behavior.

- [ ] **Step 3: Localize ReserveDetailPage.** Replace back action, reserve description, metric labels, chart headings, liquidity/rates tabs, chart legend labels, point count, TradingView footer, and snapshot error fallback. Keep `7d`, `30d`, `90d`, `liquidity`, and `rates` as stable control values.

- [ ] **Step 4: Localize SyncRunsPage.** Replace sync controls, summary labels, timeline headings, read/write labels, empty state, error summary fallback, and status/source badges. Render statuses with `statusLabel` rather than raw API values.

- [ ] **Step 5: Search all frontend source for Chinese characters and obvious internal labels.**

Run: `rg -n "[\\p{Han}]|写入|读取|尚未同步|未知时间|请求失败|失败|成功" web/src`

Expected: no user-facing matches; any remaining matches must be in tests or non-user code and be removed if unnecessary.

- [ ] **Step 6: Commit the data-page localization.**

```bash
git add web/src/pages/OverviewPage.tsx web/src/pages/ReservesPage.tsx web/src/pages/ReserveDetailPage.tsx web/src/pages/SyncRunsPage.tsx web/src/lib/copy.ts
git commit -m "feat(web): localize defi data pages in english"
```

### Task 4: Full Verification and Documentation

**Files:**

- Modify: `README.md` and relevant docs only if they still describe a bilingual or Chinese frontend.
- Verify: all files under `web/src`.

- [ ] **Step 1: Run frontend tests, frontend build, and Go tests.**

Run: `pnpm --dir web test && pnpm --dir web build && go test ./...`

Expected: all commands exit with code 0.

- [ ] **Step 2: Check language and formatting invariants.**

Run: `rg -n "[\\p{Han}]" web/src || true; rg -n "from ['\"]antd|antd/|\"antd\"|'antd'" web/src web/package.json || true; git diff --check`

Expected: no Chinese UI strings, no Ant Design imports/dependency, and no whitespace errors.

- [ ] **Step 3: Verify the browser flow.** At desktop and mobile widths, inspect login, overview, reserves, reserve detail, chart controls, sync runs, loading/error/empty states, and logout. Confirm all visible copy is English, dates and values use English formatting, and no horizontal overflow appears.

- [ ] **Step 4: Commit final verification and documentation updates.**

```bash
git add README.md docs
git commit -m "docs: record english-only frontend"
```

## Verification Matrix

| Requirement | Evidence |
| --- | --- |
| English-only user interface | `rg` over `web/src` and browser inspection |
| Stable English formatting | `copy.test.ts` and `format.test.ts` |
| No raw internal status values | status/source mapping tests and page inspection |
| Existing behavior preserved | frontend tests, Go tests, browser flow |
| Tailwind/Radix visual preserved | desktop/mobile screenshots and build |
