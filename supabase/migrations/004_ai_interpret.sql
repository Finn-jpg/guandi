-- 关帝灵签 · AI 解签
-- 使用方法:Supabase Dashboard → SQL Editor → 粘贴执行(本功能上线前需先跑)

-- AI 解签记录:每次成功生成落一条;intake 用 jsonb 存门类问答,灵活不加列
create table public.ai_interpretations (
  id         bigint generated always as identity primary key,
  visitor_id uuid,
  sign_no    integer,
  topic      text,         -- 门类 label,如 "姻缘"
  intake     jsonb,        -- { answers: [{ask, value}], freeform } 等
  model      text,         -- 如 "glm-4-flash"
  content    text,         -- 生成的解读全文
  created_at timestamptz not null default now()
);

create index on public.ai_interpretations (visitor_id, created_at);

-- RLS 全锁,不建 policy:匿名 key 不能直接读写,只能经下方 RPC
alter table public.ai_interpretations enable row level security;

-- 今日(北京时间)该访客的 AI 解签次数 —— 服务端封顶用,防刷接口烧钱
create or replace function public.ai_interpret_count_today(_visitor_id uuid)
returns integer
language sql security definer set search_path = public as $$
  select count(*)::int
  from ai_interpretations
  where visitor_id = _visitor_id
    and (created_at at time zone 'Asia/Shanghai')::date
      = (now() at time zone 'Asia/Shanghai')::date;
$$;

-- 落一条 AI 解签记录(生成成功后由 api/interpret 调用)
create or replace function public.log_ai_interpretation(
  _visitor_id uuid,
  _sign_no    integer,
  _topic      text,
  _intake     jsonb,
  _model      text,
  _content    text
) returns void
language sql security definer set search_path = public as $$
  insert into ai_interpretations (visitor_id, sign_no, topic, intake, model, content)
  values (_visitor_id, _sign_no, _topic, _intake, _model, _content);
$$;
