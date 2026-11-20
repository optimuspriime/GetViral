create extension if not exists pgcrypto;

create type public.creator_platform as enum (
  'Twitch', 'Kick', 'YouTube', 'TikTok', 'Instagram'
);
create type public.metric_status as enum (
  'public', 'creator_authorized', 'estimated'
);
create type public.prospect_status as enum (
  'To review', 'Shortlisted', 'Contacted', 'Partnered'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships m
    where m.workspace_id = target_workspace and m.user_id = auth.uid()
  );
$$;

create function public.is_workspace_admin(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

create function public.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_memberships (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger workspace_owner_membership
after insert on public.workspaces
for each row execute function public.add_workspace_owner();

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  category text,
  language text,
  creator_country text,
  creator_country_source text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  platform public.creator_platform not null,
  handle text not null,
  platform_user_id text,
  profile_url text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  unique (platform, handle)
);
create index creator_platform_accounts_creator_idx
  on public.creator_platform_accounts (creator_id);
create index creator_platform_accounts_platform_idx
  on public.creator_platform_accounts (platform);

create table public.metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.creator_platform_accounts(id) on delete cascade,
  metric_name text not null,
  value numeric,
  unit text not null,
  collected_at timestamptz not null,
  measurement_start timestamptz,
  measurement_end timestamptz,
  period_label text,
  sample_size integer check (sample_size is null or sample_size >= 0),
  source text not null,
  status public.metric_status not null,
  created_at timestamptz not null default now(),
  check (measurement_start is null or measurement_end is null or measurement_start <= measurement_end)
);
create index metric_snapshots_account_metric_date_idx
  on public.metric_snapshots (account_id, metric_name, collected_at desc);

create table public.public_content_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.creator_platform_accounts(id) on delete cascade,
  platform_content_id text,
  content_url text not null,
  published_at timestamptz,
  title text,
  content_type text,
  created_at timestamptz not null default now()
);

create table public.audience_insights (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.creator_platform_accounts(id) on delete cascade,
  dimension text not null,
  dimension_value text not null,
  value numeric,
  unit text not null,
  collected_at timestamptz not null,
  source text not null,
  status public.metric_status not null,
  confidence numeric check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table public.public_business_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.creator_platform_accounts(id) on delete cascade,
  email text not null,
  source_url text not null,
  last_checked_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.saved_lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.list_memberships (
  list_id uuid not null references public.saved_lists(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  status public.prospect_status not null default 'To review',
  notes text not null default '',
  added_by uuid not null references auth.users(id) on delete restrict,
  added_at timestamptz not null default now(),
  primary key (list_id, creator_id)
);

create table public.creator_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  tag text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (workspace_id, creator_id, tag)
);

create table public.prospect_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.platform_sync_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform public.creator_platform not null,
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  error_message text,
  source text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.creators enable row level security;
alter table public.creator_platform_accounts enable row level security;
alter table public.metric_snapshots enable row level security;
alter table public.public_content_items enable row level security;
alter table public.audience_insights enable row level security;
alter table public.public_business_contacts enable row level security;
alter table public.saved_lists enable row level security;
alter table public.list_memberships enable row level security;
alter table public.creator_tags enable row level security;
alter table public.prospect_notes enable row level security;
alter table public.platform_sync_runs enable row level security;

create policy "Profiles are readable by owner" on public.profiles
  for select using (id = auth.uid());
create policy "Users create own profile" on public.profiles
  for insert with check (id = auth.uid());
create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Members read workspaces" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "Authenticated users create workspaces" on public.workspaces
  for insert with check (created_by = auth.uid());
create policy "Workspace admins update workspaces" on public.workspaces
  for update using (public.is_workspace_admin(id))
  with check (public.is_workspace_admin(id));
create policy "Workspace admins delete workspaces" on public.workspaces
  for delete using (public.is_workspace_admin(id));

create policy "Members read workspace memberships" on public.workspace_memberships
  for select using (public.is_workspace_member(workspace_id));
create policy "Workspace admins manage memberships" on public.workspace_memberships
  for all using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "Authenticated users read creator catalog" on public.creators
  for select to authenticated using (true);
create policy "Authenticated users read platform accounts" on public.creator_platform_accounts
  for select to authenticated using (true);
create policy "Authenticated users read metric snapshots" on public.metric_snapshots
  for select to authenticated using (true);
create policy "Authenticated users read public content" on public.public_content_items
  for select to authenticated using (true);
create policy "Authenticated users read sourced insights" on public.audience_insights
  for select to authenticated using (true);
create policy "Authenticated users read public contacts" on public.public_business_contacts
  for select to authenticated using (true);

create policy "Workspace members read saved lists" on public.saved_lists
  for select using (public.is_workspace_member(workspace_id));
create policy "Workspace members create saved lists" on public.saved_lists
  for insert with check (
    public.is_workspace_member(workspace_id) and created_by = auth.uid()
  );
create policy "Workspace members update saved lists" on public.saved_lists
  for update using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "Workspace members delete saved lists" on public.saved_lists
  for delete using (public.is_workspace_member(workspace_id));
create policy "Members manage list memberships" on public.list_memberships
  for all using (
    exists (
      select 1 from public.saved_lists l
      where l.id = list_id and public.is_workspace_member(l.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.saved_lists l
      where l.id = list_id and public.is_workspace_member(l.workspace_id)
    ) and added_by = auth.uid()
  );
create policy "Workspace members read creator tags" on public.creator_tags
  for select using (public.is_workspace_member(workspace_id));
create policy "Workspace members create creator tags" on public.creator_tags
  for insert with check (
    public.is_workspace_member(workspace_id) and created_by = auth.uid()
  );
create policy "Workspace members update creator tags" on public.creator_tags
  for update using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "Workspace members delete creator tags" on public.creator_tags
  for delete using (public.is_workspace_member(workspace_id));
create policy "Workspace members read prospect notes" on public.prospect_notes
  for select using (public.is_workspace_member(workspace_id));
create policy "Workspace members create prospect notes" on public.prospect_notes
  for insert with check (
    public.is_workspace_member(workspace_id) and author_id = auth.uid()
  );
create policy "Workspace members update prospect notes" on public.prospect_notes
  for update using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "Workspace members delete prospect notes" on public.prospect_notes
  for delete using (public.is_workspace_member(workspace_id));
create policy "Workspace members read sync runs" on public.platform_sync_runs
  for select using (public.is_workspace_member(workspace_id));
create policy "Workspace members create sync runs" on public.platform_sync_runs
  for insert with check (
    public.is_workspace_member(workspace_id)
    and (created_by is null or created_by = auth.uid())
  );
create policy "Workspace members update sync runs" on public.platform_sync_runs
  for update using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
