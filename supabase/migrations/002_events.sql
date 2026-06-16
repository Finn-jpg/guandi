-- 关帝灵签 · 埋点事件表
-- 使用方法:Supabase Dashboard → SQL Editor → 粘贴本文件全部内容 → Run(执行一次即可)

-- 事件流水表:记录 9 个按钮的 show(曝光)/ click(点击)
create table public.events (
  id         bigint generated always as identity primary key,
  session_id uuid not null,            -- 一次求签会话(welcome_start 曝光时分配)
  visitor_id uuid,                     -- 访客 ID(可与 users/draw_records join);纯日志,不设外键
  event_name text not null,            -- welcome_start / ask_toss / ask_continue / draw /
                                       -- confirm_toss / confirm_continue / result_thanks / share / again
  event_type text not null,            -- 'show' | 'click'
  trigger    text,                     -- 'click' | 'shake'(仅 click 事件;show 为 null)
  stage      text,                     -- welcome / ask / draw / confirm / result / closing
  sign_no    integer,                  -- 当前签号(confirm/result 阶段带上)
  client_ts  timestamptz,              -- 客户端时间,精确排序
  created_at timestamptz not null default now()
);

create index on public.events (session_id);
create index on public.events (event_name, event_type);
create index on public.events (created_at);

-- RLS 全锁,不建任何 policy:匿名 key 无法直接读写,只能经下方函数写入
alter table public.events enable row level security;

-- 唯一写入口:security definer 绕过 RLS,但只能按函数体插入一条事件
create or replace function public.log_event(
  _session_id uuid,
  _visitor_id uuid,
  _event_name text,
  _event_type text,
  _trigger    text,
  _stage      text,
  _sign_no    integer,
  _client_ts  timestamptz
) returns void
language sql security definer set search_path = public as $$
  insert into events (session_id, visitor_id, event_name, event_type, trigger, stage, sign_no, client_ts)
  values (_session_id, _visitor_id, _event_name, _event_type, _trigger, _stage, _sign_no, _client_ts);
$$;
