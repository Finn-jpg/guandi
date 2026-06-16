# CLAUDE.md

关帝灵签 · 移动端求签解签 Web 应用。本文件是给 Claude Code 每次开工读的项目约定,改动代码前先读一遍。

## 技术栈

- React 18 + TypeScript + Vite 6;Tailwind 4(`@theme` 设计令牌)
- 动画 framer-motion
- 后端 Supabase(Postgres);部署 Vercel(`main` 自动上生产,分支自动 Preview)
- Anthropic API 用于 AI 解签(规划中)

## 架构

- 仪式状态机在 `src/App.tsx`:`welcome → ask → draw → confirm → result → closing`
- 每个阶段一个组件 `src/components/*`;公共原子(按钮/容器/印章)在 `ui.tsx`
- 求签纯逻辑(掷茭/抽签)在 `src/hooks/useDivination.ts`;摇一摇在 `useShake.ts`
- 数据访问在 `src/lib/`:`supabase.ts`(客户端)、`visitor.ts`(访客)、`track.ts`(埋点)
- 100 签数据 `src/data/guandi.json`(由 `scripts/scrape.mjs` 生成,开发期工具)

## 承重约定(改动时务必遵守)

### 安全

- 所有表 **RLS 全锁、不建 policy**;匿名 publishable key 视为公开。
- 一切写入只经 `security definer` RPC(`track_visit` / `record_draw` / `log_event` …);前端**不直接** insert/update/delete。

### 数据上报(telemetry)

- 一律 **fire-and-forget**:包 try/catch 吞错,绝不 await 阻塞 UI。
- ⚠️ supabase 查询是**惰性 thenable**,必须 `.then(...)` 才会真正发请求(见 `track.ts`)。

### 数据库迁移

- `supabase/migrations/00X_*.sql` 顺序编号、**纳入 git**,是 schema 唯一事实源。
- **只做增量、向后兼容**变更(只加表/列,不删不改);Preview 与生产**共用同一个库**。
- 迁移在 Supabase SQL Editor **手动执行**(无 CI 自动应用);PR 描述里注明"需先跑 00X.sql"。

### 通用

- 日期分区一律**北京时间**:`(ts at time zone 'Asia/Shanghai')::date`。
- `visitor_id` 是**设备级**标识(localStorage uuid),非用户级。
- 主题色只在 `src/index.css` 的 `@theme` 改;组件用 `var(--color-*)`,不硬编码色值。
- 注释解释"**为什么**",用中文;贴合周围代码风格。

## 工作流

- 功能开短分支 `feat/xxx`、杂项 `chore/xxx` → 推送触发 Vercel Preview → 自测 → 开 PR 合并 `main` 上线。
- **不直接往 `main` 提交功能**。
- 语义化版本(`package.json`)+ `CHANGELOG.md` + git tag;每次发布更新。
- commit 用中文,结尾带 `Co-Authored-By: Claude <noreply@anthropic.com>`。

## 常用命令

- `npm run dev` —— 本地开发
- `npm run build` —— 类型检查 + 打包(**合并前必过**)
- `npm run format` —— Prettier 格式化
- `npm run scrape` —— 重抓签文(很少用)

## 注意

- 摇一摇需 HTTPS + iOS 上先在用户手势内授权(Welcome 的"上香起卦"按钮)。
- `/api/geo` 仅 Vercel 线上存在;本地 `npm run dev` 地理字段为空属正常。
- 工具链:Prettier 管格式,tsc 管类型;暂未上 ESLint(代码量小,等上登录/支付再加)。
