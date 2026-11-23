-- ==============================================================================
-- MOSAIC / GETVIRAL CREATOR SCOUT - SUPABASE DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- 2. Creators Table
create table if not exists public.creators (
  id text primary key,
  name text not null,
  category text,
  language text,
  creator_country text,
  creator_country_source text,
  bio text,
  avatar text,
  business_contact_email text,
  business_contact_source text,
  business_contact_last_checked timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for speedy searching
create index if not exists idx_creators_name on public.creators (name);
create index if not exists idx_creators_category on public.creators (category);
create index if not exists idx_creators_country on public.creators (creator_country);

-- 3. Platform Accounts Table (YouTube, Twitch, Kick, TikTok, Instagram)
create table if not exists public.creator_platform_accounts (
  id text primary key,
  creator_id text not null references public.creators(id) on delete cascade,
  platform text not null,
  handle text not null,
  profile_url text not null,
  activity text,
  created_at timestamptz not null default now(),
  unique (platform, handle)
);

create index if not exists idx_platform_accounts_creator on public.creator_platform_accounts (creator_id);
create index if not exists idx_platform_accounts_platform on public.creator_platform_accounts (platform);

-- 4. Metric Snapshots Table (Followers, Views, Live Viewers over time)
create table if not exists public.metric_snapshots (
  id text primary key,
  account_id text not null references public.creator_platform_accounts(id) on delete cascade,
  metric_name text not null,
  value numeric,
  unit text not null default 'count',
  collected_at timestamptz not null default now(),
  window_start timestamptz,
  window_end timestamptz,
  period_label text,
  sample_size integer,
  source text not null default 'Platform API',
  status text not null default 'public',
  created_at timestamptz not null default now()
);

create index if not exists idx_metric_snapshots_account on public.metric_snapshots (account_id, metric_name, collected_at desc);

-- 5. Audience Demographic & Regional Insights
create table if not exists public.audience_insights (
  id text primary key default gen_random_uuid()::text,
  creator_id text not null references public.creators(id) on delete cascade,
  dimension text not null,
  value text not null,
  amount numeric,
  unit text default '%',
  confidence numeric default 0.9,
  source text default 'Platform Analytics',
  status text default 'public',
  collected_at timestamptz not null default now()
);

create index if not exists idx_audience_insights_creator on public.audience_insights (creator_id);

-- 6. User Subscriptions & Search Quota Table
create table if not exists public.user_subscriptions (
  user_id text primary key,
  plan_id text not null default 'free',
  searches_used integer not null default 0,
  searches_remaining integer not null default 50,
  total_quota integer not null default 50,
  role text not null default 'viewer',
  updated_at timestamptz not null default now()
);

-- 7. Workspaces & Saved Lists (CRM Shortlists)
create table if not exists public.workspaces (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_lists (
  id text primary key default gen_random_uuid()::text,
  workspace_id text references public.workspaces(id) on delete cascade,
  name text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.list_memberships (
  list_id text references public.saved_lists(id) on delete cascade,
  creator_id text references public.creators(id) on delete cascade,
  status text default 'To review',
  notes text default '',
  tags text[] default '{}',
  added_at timestamptz not null default now(),
  primary key (list_id, creator_id)
);

-- 8. Row Level Security (RLS) - Enable Read & Write Access
alter table public.creators enable row level security;
alter table public.creator_platform_accounts enable row level security;
alter table public.metric_snapshots enable row level security;
alter table public.audience_insights enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.workspaces enable row level security;
alter table public.saved_lists enable row level security;
alter table public.list_memberships enable row level security;

-- Drop existing policies if rerun
drop policy if exists "Public read creators" on public.creators;
drop policy if exists "Public insert/update creators" on public.creators;
drop policy if exists "Public read accounts" on public.creator_platform_accounts;
drop policy if exists "Public insert/update accounts" on public.creator_platform_accounts;
drop policy if exists "Public read metric snapshots" on public.metric_snapshots;
drop policy if exists "Public insert metric snapshots" on public.metric_snapshots;
drop policy if exists "Public read audience insights" on public.audience_insights;
drop policy if exists "Public insert audience insights" on public.audience_insights;
drop policy if exists "Public subscriptions read/write" on public.user_subscriptions;
drop policy if exists "Public workspaces read/write" on public.workspaces;
drop policy if exists "Public lists read/write" on public.saved_lists;
drop policy if exists "Public memberships read/write" on public.list_memberships;

-- Read policies (Anyone can read public creator catalog)
create policy "Public read creators" on public.creators for select using (true);
create policy "Public insert/update creators" on public.creators for all using (true) with check (true);

create policy "Public read accounts" on public.creator_platform_accounts for select using (true);
create policy "Public insert/update accounts" on public.creator_platform_accounts for all using (true) with check (true);

create policy "Public read metric snapshots" on public.metric_snapshots for select using (true);
create policy "Public insert metric snapshots" on public.metric_snapshots for all using (true) with check (true);

create policy "Public read audience insights" on public.audience_insights for select using (true);
create policy "Public insert audience insights" on public.audience_insights for all using (true) with check (true);

create policy "Public subscriptions read/write" on public.user_subscriptions for all using (true) with check (true);
create policy "Public workspaces read/write" on public.workspaces for all using (true) with check (true);
create policy "Public lists read/write" on public.saved_lists for all using (true) with check (true);
create policy "Public memberships read/write" on public.list_memberships for all using (true) with check (true);
