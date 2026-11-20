alter table public.metric_snapshots
  add column if not exists sample_size integer check (sample_size is null or sample_size >= 0);

create function public.provision_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  workspace_name text;
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;

  workspace_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'My'
  ) || ' workspace';

  insert into public.workspaces (name, created_by)
  values (workspace_name, new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.provision_new_user();

drop policy if exists "Members manage list memberships" on public.list_memberships;

create policy "Workspace members read list memberships"
  on public.list_memberships for select
  using (
    exists (
      select 1 from public.saved_lists l
      where l.id = list_id and public.is_workspace_member(l.workspace_id)
    )
  );

create policy "Workspace members add list memberships"
  on public.list_memberships for insert
  with check (
    added_by = auth.uid()
    and exists (
      select 1 from public.saved_lists l
      where l.id = list_id and public.is_workspace_member(l.workspace_id)
    )
  );

create policy "Workspace members update list memberships"
  on public.list_memberships for update
  using (
    exists (
      select 1 from public.saved_lists l
      where l.id = list_id and public.is_workspace_member(l.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.saved_lists l
      where l.id = list_id and public.is_workspace_member(l.workspace_id)
    )
  );

create policy "Workspace members remove list memberships"
  on public.list_memberships for delete
  using (
    exists (
      select 1 from public.saved_lists l
      where l.id = list_id and public.is_workspace_member(l.workspace_id)
    )
  );
