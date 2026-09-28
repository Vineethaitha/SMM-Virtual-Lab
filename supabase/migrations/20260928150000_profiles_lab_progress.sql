-- 21CSC403T Virtual Lab: profiles, faculty allowlist, lab progress

create table public.faculty_allowlist (
  email text primary key
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  registration_number text,
  role text not null default 'student' check (role in ('student', 'faculty')),
  created_at timestamptz not null default now()
);

create table public.lab_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lab_key text not null check (lab_key in ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'final')),
  exercise_completed_at timestamptz,
  quiz_completed_at timestamptz,
  quiz_score integer,
  quiz_total integer,
  report_downloaded_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lab_key)
);

-- Faculty emails (add more rows as needed)
-- insert into public.faculty_allowlist (email) values ('grace.s@example.edu');

create or replace function public.is_faculty()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'faculty'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    case
      when exists (
        select 1 from public.faculty_allowlist
        where lower(email) = lower(coalesce(new.email, ''))
      ) then 'faculty'
      else 'student'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_faculty() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

create or replace function public.touch_lab_progress(
  p_lab_key text,
  p_exercise boolean default false,
  p_quiz_score integer default null,
  p_quiz_total integer default null,
  p_report boolean default false
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_lab_key is null or p_lab_key not in ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'final') then
    raise exception 'invalid lab_key';
  end if;

  insert into public.lab_progress (
    user_id,
    lab_key,
    exercise_completed_at,
    quiz_completed_at,
    quiz_score,
    quiz_total,
    report_downloaded_at
  )
  values (
    auth.uid(),
    p_lab_key,
    case when p_exercise then now() else null end,
    case when p_quiz_score is not null then now() else null end,
    p_quiz_score,
    p_quiz_total,
    case when p_report then now() else null end
  )
  on conflict (user_id, lab_key) do update set
    exercise_completed_at = case
      when p_exercise then coalesce(public.lab_progress.exercise_completed_at, now())
      else public.lab_progress.exercise_completed_at
    end,
    quiz_completed_at = case
      when p_quiz_score is not null then coalesce(public.lab_progress.quiz_completed_at, now())
      else public.lab_progress.quiz_completed_at
    end,
    quiz_score = coalesce(p_quiz_score, public.lab_progress.quiz_score),
    quiz_total = coalesce(p_quiz_total, public.lab_progress.quiz_total),
    report_downloaded_at = case
      when p_report then coalesce(public.lab_progress.report_downloaded_at, now())
      else public.lab_progress.report_downloaded_at
    end,
    updated_at = now();
end;
$$;

alter table public.faculty_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.lab_progress enable row level security;

create policy "faculty read allowlist"
  on public.faculty_allowlist for select
  to authenticated
  using (public.is_faculty());

create policy "profiles select own or faculty"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_faculty());

create policy "profiles insert own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "progress select own or faculty"
  on public.lab_progress for select
  to authenticated
  using (user_id = auth.uid() or public.is_faculty());

create policy "progress insert own"
  on public.lab_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "progress update own"
  on public.lab_progress for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.lab_progress to authenticated;
grant select on public.faculty_allowlist to authenticated;
grant execute on function public.touch_lab_progress(text, boolean, integer, integer, boolean) to authenticated;
grant execute on function public.is_faculty() to authenticated;
