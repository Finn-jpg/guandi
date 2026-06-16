-- 关帝灵签 · 分析层(供 Metabase 接入)
-- 使用方法:Supabase Dashboard → SQL Editor → 粘贴执行
-- 说明:
--   * 所有「自然日」按北京时间:(ts at time zone 'Asia/Shanghai')::date
--   * 视图属主为 postgres(bypassrls),Metabase 经视图读全量,碰不到原始表
--   * daily_active 用实时视图,零维护;量大再改物化视图(SQL 同款)

-- ── 活跃表(实时视图):粒度 = (北京日期, visitor_id) ────────────────────
-- 来源 events 的 distinct visitor:凡当天打过任意事件即算活跃(开 App 即有 welcome_start)
create or replace view daily_active as
select distinct
  (created_at at time zone 'Asia/Shanghai')::date as stat_date,
  visitor_id
from events
where visitor_id is not null;

-- ── 每日规模:新增 + 活跃(DAU) ──────────────────────────────────────
-- 新增:users.first_seen_at 落在当日(北京时间)
-- 活跃:当日 distinct visitor_id
create or replace view analytics_daily as
with active as (
  select stat_date, count(distinct visitor_id) as active_users
  from daily_active
  group by stat_date
),
newu as (
  select (first_seen_at at time zone 'Asia/Shanghai')::date as stat_date,
         count(*) as new_users
  from users
  group by 1
)
select coalesce(a.stat_date, n.stat_date) as stat_date,
       coalesce(n.new_users, 0)           as new_users,
       coalesce(a.active_users, 0)        as active_users
from active a
full outer join newu n on a.stat_date = n.stat_date
order by 1;

-- ── 留存:基于活跃表的 cohort(按「首次活跃日」分群) ──────────────────
-- day_n = 距首次活跃的天数;retention_rate = 第 N 日仍活跃人数 / 群规模
create or replace view analytics_retention as
with first_active as (
  select visitor_id, min(stat_date) as cohort_date
  from daily_active
  group by visitor_id
),
sized as (
  select cohort_date, count(*) as cohort_size
  from first_active
  group by cohort_date
),
ret as (
  select f.cohort_date,
         (a.stat_date - f.cohort_date) as day_n,
         count(distinct a.visitor_id)  as retained
  from first_active f
  join daily_active a on a.visitor_id = f.visitor_id
  group by f.cohort_date, (a.stat_date - f.cohort_date)
)
select r.cohort_date,
       r.day_n,
       r.retained,
       s.cohort_size,
       round(r.retained::numeric / nullif(s.cohort_size, 0), 4) as retention_rate
from ret r
join sized s on s.cohort_date = r.cohort_date
order by r.cohort_date, r.day_n;

-- ── 漏斗:9 步按序统计 distinct session ───────────────────────────────
-- reached = 该步按钮曝光过的会话数(到达);clicked = 点击过的会话数(转化)
create or replace view analytics_funnel as
with steps(event_name, step_order) as (
  values
    ('welcome_start', 1), ('ask_toss', 2), ('ask_continue', 3), ('draw', 4),
    ('confirm_toss', 5), ('confirm_continue', 6), ('result_thanks', 7),
    ('share', 8), ('again', 9)
)
select s.step_order,
       s.event_name,
       count(distinct e.session_id) filter (where e.event_type = 'show')  as reached_sessions,
       count(distinct e.session_id) filter (where e.event_type = 'click') as clicked_sessions
from steps s
left join events e on e.event_name = s.event_name
group by s.step_order, s.event_name
order by s.step_order;

-- ── 摇一摇 / 点击分布 ─────────────────────────────────────────────────
-- 明细:按事件 × trigger(掷茭/抽签三类按钮才有 shake)
create or replace view analytics_trigger as
select event_name,
       trigger,
       count(*) as clicks
from events
where event_type = 'click' and trigger is not null
group by event_name, trigger
order by event_name, trigger;

-- 汇总:整体 shake vs click
create or replace view analytics_trigger_overall as
select trigger, count(*) as clicks
from events
where event_type = 'click' and trigger is not null
group by trigger;

-- ── Metabase 只读角色:仅能 SELECT 上述分析视图 ───────────────────────
-- ⚠️ 执行前把下面的密码改成一个强口令,并记下来用于 Metabase 连接
do $$
begin
  if not exists (select from pg_roles where rolname = 'metabase_ro') then
    create role metabase_ro login password 'REPLACE_WITH_A_STRONG_PASSWORD';
  end if;
end $$;

grant usage on schema public to metabase_ro;
grant select on
  daily_active,
  analytics_daily,
  analytics_retention,
  analytics_funnel,
  analytics_trigger,
  analytics_trigger_overall
to metabase_ro;
