-- Run this entire file in Supabase → SQL Editor → New query → Run

-- ── TABLES ──────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  upi_id text,
  rating numeric default 5.0,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  amount integer not null,
  deadline text,
  status text default 'open'
    check (status in ('open', 'accepted', 'completed', 'cancelled')),
  poster_id uuid references auth.users not null,
  poster_name text,
  poster_initials text,
  poster_rating numeric,
  doer_id uuid references auth.users,
  doer_name text,
  otp_code text,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table tasks enable row level security;

create policy "profiles_select" on profiles
  for select using (true);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "tasks_select" on tasks
  for select using (
    status = 'open'
    or poster_id = auth.uid()
    or doer_id = auth.uid()
  );

create policy "tasks_insert" on tasks
  for insert with check (auth.uid() = poster_id);

create policy "tasks_update_poster" on tasks
  for update using (auth.uid() = poster_id);

create policy "tasks_update_doer" on tasks
  for update using (auth.uid() = doer_id);

-- ── ACCEPT TASK (race-condition safe) ─────────────────────────────────────

create or replace function accept_task(
  p_task_id uuid,
  p_doer_id uuid,
  p_doer_name text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_otp text := lpad(floor(random() * 10000)::text, 4, '0');
begin
  update tasks
  set
    status = 'accepted',
    doer_id = p_doer_id,
    doer_name = p_doer_name,
    otp_code = v_otp
  where id = p_task_id
    and status = 'open'
    and poster_id != p_doer_id;

  if found then
    return json_build_object('success', true);
  else
    return json_build_object('success', false, 'message', 'Task already taken or not available');
  end if;
end;
$$;

grant execute on function accept_task(uuid, uuid, text) to authenticated;

-- ── REALTIME ──────────────────────────────────────────────────────────────
-- Dashboard → Database → Replication → enable "tasks" table
