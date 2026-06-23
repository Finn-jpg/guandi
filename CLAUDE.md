# CLAUDE.md

关帝灵签 · 移动端求签解签 Web 应用。本文件是给 Claude Code 每次开工读的项目约定,改动代码前先读一遍。它也是**埋点与数据库的权威登记表**——新增前先看这里,改完同步回来。

## 技术栈

- React 18 + TypeScript + Vite 6;Tailwind 4(`@theme` 设计令牌)
- 动画 framer-motion
- 后端 Supabase(Postgres);部署 Vercel(`main` 自动上生产,分支自动 Preview)
- AI 解签已上线:**智谱 GLM**(OpenAI 兼容),服务端 `api/interpret`(Edge 流式);provider 由环境变量 `AI_BASE_URL/AI_API_KEY/AI_MODEL` 决定,换供应商不改代码

## 架构

- 仪式状态机在 `src/App.tsx`:`welcome → ask → draw → confirm → result → closing`(welcome 有每日上限拦截)
- 每个阶段一个组件 `src/components/*`;公共原子(按钮/容器/印章)在 `ui.tsx`;AI 解签面板 `AiInterpret.tsx`(嵌在结果页)
- 求签纯逻辑(掷茭/抽签)在 `src/hooks/useDivination.ts`;摇一摇在 `useShake.ts`
- `src/lib/`:`supabase.ts`(客户端)、`visitor.ts`(访客 + 上报)、`track.ts`(埋点)、`dailyLimit.ts`(每日上限,localStorage)、`signCard.ts`(签文卡 Canvas 渲染)、`version.ts`
- `api/`(**仅 Vercel 线上**):`geo.ts`(读地理头)、`interpret.ts`(AI 解签 SSE 流式)
- 数据:100 签 `src/data/guandi.json`(`scripts/scrape.mjs` 生成);AI 门类配置 `src/data/topics.ts`

## 承重约定(改动时务必遵守)

### 安全

- 所有表 **RLS 全锁、不建 policy**;匿名 publishable key 视为公开。
- 一切写入只经 `security definer` RPC;前端**不直接** insert/update/delete。
- `AI_API_KEY` 等机密只在服务端(Vercel 环境变量),**绝不入前端 bundle / 仓库**。

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

## 埋点登记表(authoritative)

源:`src/lib/track.ts` 的 `EventName` → `log_event` RPC → `events` 表(002)。**新增埋点** = ① 在 `track.ts` 的 `EventName` 注册 ② 在此表登记 ③ 经 `useShow`(曝光)/`track`(点击)上报。

- 字段:`event_type` = `show`|`click`;`trigger` = `click`|`shake`(**仅 click**;show 为 null);公参 = session_id / visitor_id / sign_no? / stage? / client_ts。
- session:`welcome_start` 的 show 时 `startSession()` 分配,一次求签会话内复用;回 welcome 即开新会话。

| event_name | 触发处 | 备注 |
|---|---|---|
| `welcome_start` | Welcome | show 时开新 session |
| `ask_toss` | JiaoToss(ask) | click 带 trigger(摇/点) |
| `ask_continue` | JiaoToss(ask 圣筊后) | |
| `draw` | DrawSign | click 带 trigger |
| `confirm_toss` | JiaoToss(confirm) | 带 sign_no |
| `confirm_continue` | JiaoToss(confirm 圣筊后) | 此处写 `draw_records` |
| `result_thanks` | SignResult | |
| `share` | Closing | 复制裂变文案 |
| `save_sign` | Closing | 生成签文卡 |
| `again` | Closing | 再求一签 |
| `limit_reached` | Welcome(超限) | 需求信号(想多求) |
| `ai_interpret` | AiInterpret(结果页) | AI 解签 |

## 数据库登记表(authoritative)

全部表 RLS 锁、经 security definer RPC 写。**改 schema** = 新增 `00X` 迁移(只增不改)+ 更新此表 + PR 注明"需先跑 00X.sql"。

| 表 | 用途 | 写入 RPC | 迁移 |
|---|---|---|---|
| `users` | 访客(IP/地理/UA/访问数) | `track_visit` | 001 |
| `draw_records` | 求签记录(签号/干支/吉凶) | `record_draw` | 001 |
| `events` | 埋点流水 | `log_event` | 002 |
| `ai_interpretations` | AI 解签(intake jsonb) | `log_ai_interpretation` · `ai_interpret_count_today`(每日封顶) | 004 |

- 分析视图(003,只读角色 `metabase_ro` 供 Metabase):`daily_active`、`analytics_daily` / `_retention` / `_funnel` / `_trigger(_overall)`。
- 迁移清单:001 init · 002 events · 003 analytics · 004 ai_interpret。
- 环境变量(Vercel):`AI_API_KEY`(机密)、`AI_BASE_URL`、`AI_MODEL`(默认智谱 GLM);`SUPABASE_URL/ANON` 有硬编码兜底。
- 每日上限 **3 次**:前端 `dailyLimit.ts`(localStorage 软限)+ 服务端 `ai_interpret_count_today`(硬封顶,防刷 AI)。

## 工作流

- 功能开短分支 `feat/xxx`、杂项 `chore/xxx` → 推送触发 Vercel Preview → 自测 → 开 PR 合并 `main` 上线。
- **不直接往 `main` 提交功能**。验收后由我合并(用户说"合并"),或用户在 GitHub 合并后告知同步。
- 语义化版本(`package.json`)+ `CHANGELOG.md` + git tag;每次发布更新。
- commit 用中文,结尾带 `Co-Authored-By: Claude <noreply@anthropic.com>`。

## 上下文 / token 经济

- 每个独立功能尽量**开新会话 / 适时 `/compact`**,靠本文件续接,避免单会话历史膨胀。
- **压缩时按优先级保留**(拿不准时,"为什么" > "做了什么",决策 > 过程叙述):
  1. 架构与产品决策 + 理由(**永不省略**)
  2. 已排除的方案及原因(避免重试踩过的坑)
  3. 改动过的文件及其关键改动
  4. 当前验证状态(pass/fail + 怎么验的)、已知未修问题
  5. 待办、回滚点、**未完成的外部/手动步骤**(要跑的迁移 / 要配的环境变量 / 用户待办 / 待合并 PR)
  6. 当前 git 状态(分支 / 已提交未推 / 是否已合 main)
  7. 工具输出可删,只留 pass/fail 与关键结论

## 常用命令

- `npm run dev` —— 本地开发
- `npm run build` —— 类型检查 + 打包(**合并前必过**)
- `npm run format` —— Prettier 格式化
- `npm run scrape` —— 重抓签文(很少用)

## 注意

- 摇一摇需 HTTPS + iOS 上先在用户手势内授权(Welcome 的"上香起卦"按钮)。
- `/api/*` 仅 Vercel 线上存在;本地 `npm run dev` 地理字段为空、`/api/interpret` 走错误兜底,均属正常。
- 工具链:Prettier 管格式,tsc 管类型;暂未上 ESLint(代码量小,等上登录/支付再加)。
- 生产域名 **www.qianyuqifu.com**;对外链接一律用 `https://` 完整地址(裸域名易被运营商 HTTP 劫持)。
