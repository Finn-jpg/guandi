-- 关帝灵签 · 数据库初始化
-- 使用方法:Supabase Dashboard → SQL Editor → 粘贴本文件全部内容 → Run(执行一次即可)

-- 用户表:暂无登录体系,以浏览器 localStorage 中的匿名 UUID 标识访客
create table public.users (
  id            uuid primary key,
  ip            text,
  city          text,
  region        text,
  country       text,
  latitude      double precision,
  longitude     double precision,
  user_agent    text,
  visit_count   integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- 求签记录表:每次"神佛钦定"(确认筊通过)后落一条
create table public.draw_records (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.users (id) on delete set null,
  sign_no    integer not null,
  ganzhi     text,
  fortune    text,
  created_at timestamptz not null default now()
);

-- 开启行级安全且不建任何 policy:匿名 key 对两张表无直接读写权限,
-- 全部写入经由下方 security definer 函数完成
alter table public.users enable row level security;
alter table public.draw_records enable row level security;

-- 访客上报:首访插入,回访更新地理信息并累加访问次数
create or replace function public.track_visit(
  _id         uuid,
  _ip         text,
  _city       text,
  _region     text,
  _country    text,
  _latitude   double precision,
  _longitude  double precision,
  _user_agent text
) returns void
language sql security definer set search_path = public as $$
  insert into users (id, ip, city, region, country, latitude, longitude, user_agent)
  values (_id, _ip, _city, _region, _country, _latitude, _longitude, _user_agent)
  on conflict (id) do update set
    ip           = coalesce(excluded.ip, users.ip),
    city         = coalesce(excluded.city, users.city),
    region       = coalesce(excluded.region, users.region),
    country      = coalesce(excluded.country, users.country),
    latitude     = coalesce(excluded.latitude, users.latitude),
    longitude    = coalesce(excluded.longitude, users.longitude),
    user_agent   = excluded.user_agent,
    visit_count  = users.visit_count + 1,
    last_seen_at = now();
$$;

-- 求签记录:若访客行尚未建立(如地理上报失败),先补一行空用户保证外键成立
create or replace function public.record_draw(
  _user_id uuid,
  _sign_no integer,
  _ganzhi  text,
  _fortune text
) returns void
language sql security definer set search_path = public as $$
  insert into users (id) values (_user_id)
  on conflict (id) do nothing;

  insert into draw_records (user_id, sign_no, ganzhi, fortune)
  values (_user_id, _sign_no, _ganzhi, _fortune);
$$;
