# AavePulse Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the documented AavePulse read-only Aave V3 monitoring application on the gin-admin template, including PostgreSQL persistence, The Graph synchronization, authenticated APIs, and a React dashboard.

**Architecture:** Generate the backend from gin-admin with gin-admin-cli, retain its RBAC/bootstrap/Wire layers, and add a DEFI module following schema/dal/biz/api boundaries. Persist current reserve state and snapshots in PostgreSQL; serve aggregation APIs to a standalone Vite React frontend using Ant Design and TradingView Lightweight Charts.

**Tech Stack:** Go, Gin, GORM, Casbin, Wire, PostgreSQL, The Graph GraphQL, React, TypeScript, Vite, Ant Design, Lightweight Charts, Docker Compose.

---

### Task 1: Replace the custom backend with the template

**Files:**
- Replace: `cmd`, `internal`, `pkg`, `go.mod`, `go.sum`, `main.go`, `Makefile`, `Dockerfile`
- Create: `LICENSE`, `NOTICE`, `configs/dev/*.toml`
- Preserve: `docs`, `AGENTS.md`

**Steps:**
1. Run gin-admin-cli against the upstream main branch in a temporary parent directory.
2. Verify generated module imports, application name, version, and binary name.
3. Restore the upstream Apache-2.0 license and add derivative-work notice.
4. Remove the old custom backend and copy the verified generated baseline into the workspace.
5. Run `go test ./...` and fix template compatibility issues without changing behavior.

### Task 2: Implement the DEFI domain with TDD

**Files:**
- Create: `internal/mods/defi/schema/*.go`
- Create: `internal/mods/defi/dal/*.go`
- Create: `internal/mods/defi/biz/*.go`
- Create: `internal/mods/defi/graph/*.go`
- Create: `internal/mods/defi/api/*.go`
- Create: `internal/mods/defi/*_test.go`
- Modify: `internal/mods/mods.go`, `internal/wirex/wire.go`, `internal/wirex/wire_gen.go`

**Steps:**
1. Write failing tests for metric conversion, demo data, Graph response mapping, and retry behavior.
2. Run focused tests and confirm each fails for the missing behavior.
3. Implement the Graph client and explicit demo provider until tests pass.
4. Write failing repository tests for idempotent reserve upsert and snapshots.
5. Implement schemas and DAL with fixed-point decimal fields and unique constraints.
6. Write failing service tests for sync locking, sync run status, overview aggregation, reserve filtering, and trend ranges.
7. Implement services and API handlers, then regenerate Wire and Swagger.
8. Run `go test ./internal/mods/defi/...` and `go test ./...`.

### Task 3: Add PostgreSQL and local operation

**Files:**
- Create: `docker-compose.yml`, `.env.example`
- Modify: `configs/dev/server.toml`, `configs/menu_cn.json`, `.gitignore`, `Makefile`

**Steps:**
1. Configure PostgreSQL as the default database and memory as the default cache.
2. Add Docker Compose health checks and non-secret development defaults.
3. Add DEFI page and button resources to the Chinese menu.
4. Add make targets for infrastructure, backend, tests, and frontend.
5. Verify config parsing and compose syntax.

### Task 4: Build the dashboard frontend

**Files:**
- Create: `web/package.json`, `web/vite.config.ts`, `web/src/**/*`, `web/index.html`
- Create: `web/src/**/*.test.tsx`

**Steps:**
1. Generate and persist the UI design system for a DeFi operations dashboard.
2. Write failing tests for authentication storage, API error handling, and metric formatting.
3. Implement the API client and formatting helpers until tests pass.
4. Implement login, overview, reserves, reserve detail/trends, and sync history pages.
5. Use Ant Design for controls and Lightweight Charts for line/area trends.
6. Verify responsive layout, keyboard focus, loading, empty, and error states.
7. Run frontend tests and `pnpm build`.

### Task 5: End-to-end verification and cleanup

**Files:**
- Modify: `README.md`, relevant docs and configs
- Remove: upstream demo images, QR images, English template README, unused template packages proven unreferenced

**Steps:**
1. Run Go formatting, tests, vet, and build.
2. Run frontend tests and production build.
3. Start PostgreSQL, start the backend in demo mode, and verify login and all documented DEFI endpoints.
4. Serve the frontend and verify the main user flow in a browser at desktop and mobile sizes.
5. Search for old application names, old module imports, secrets, and unwanted template branding.
6. Re-read `docs/requirements.md` and record evidence for every acceptance criterion.
7. Update README with exact local setup and demo credentials.
