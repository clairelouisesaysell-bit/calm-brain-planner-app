-- Run this once in the Supabase SQL Editor for your project
-- (Project -> SQL Editor -> New query -> paste -> Run).

create table if not exists public.planner_entries (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.planner_entries enable row level security;

create policy "Users can view their own planner entry"
  on public.planner_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own planner entry"
  on public.planner_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own planner entry"
  on public.planner_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
