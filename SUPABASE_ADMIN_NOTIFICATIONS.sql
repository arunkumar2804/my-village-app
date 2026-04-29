-- Run this in Supabase SQL Editor
-- Purpose: enable reliable admin-role updates and notifications

begin;

-- 1) Profiles role columns
alter table public.profiles
  add column if not exists role text,
  add column if not exists is_admin boolean default false;

update public.profiles
set role = coalesce(role, 'user');

update public.profiles
set is_admin = coalesce(is_admin, false);

alter table public.profiles
  alter column role set default 'user';

alter table public.profiles
  alter column is_admin set default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin'));
  end if;
end
$$;

-- Promote master admin
update public.profiles
set role = 'admin', is_admin = true
where lower(email) = 'arunkumail29@gmail.com';

-- 2) Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  target_type text not null default 'all' check (target_type in ('all', 'selected')),
  target_user_ids text[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists notifications_target_type_idx on public.notifications(target_type);

-- 3) RLS for profiles
alter table public.profiles enable row level security;

-- Remove old versions if present
drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own_safe on public.profiles;
drop policy if exists profiles_admin_manage on public.profiles;

create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.role = 'admin')
  )
);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and coalesce(role, 'user') = 'user'
  and coalesce(is_admin, false) = false
);

create policy profiles_update_own_safe
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and coalesce(role, 'user') = 'user'
  and coalesce(is_admin, false) = false
);

create policy profiles_admin_manage
on public.profiles
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.role = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.role = 'admin')
  )
);

-- 4) RLS for notifications
alter table public.notifications enable row level security;

-- Remove old versions if present
drop policy if exists notifications_read_targeted on public.notifications;
drop policy if exists notifications_admin_manage on public.notifications;

create policy notifications_read_targeted
on public.notifications
for select
to authenticated
using (
  is_active = true
  and (
    target_type = 'all'
    or auth.uid()::text = any(target_user_ids)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and (p.is_admin = true or p.role = 'admin')
    )
  )
);

create policy notifications_admin_manage
on public.notifications
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.role = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.role = 'admin')
  )
);

commit;
