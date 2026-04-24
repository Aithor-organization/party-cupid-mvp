-- Party Cupid MVP — Triggers (v6 기획서 S-19)
-- auth.users INSERT 시 profiles 자동 생성
-- 익명 사용자(is_anonymous = true)는 profiles row 생성 안 함 (주최자만)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 익명 사용자는 profiles 생성 스킵 (참여자는 닉네임만 쓰므로)
  if new.is_anonymous = true then
    return new;
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user is '주최자(non-anonymous) 가입 시 profiles row 자동 생성';

-- =============================================================================
-- 참여자 입장 시 entry_number 자동 채번
-- =============================================================================
create or replace function public.assign_entry_number()
returns trigger
language plpgsql
as $$
declare
  next_number int;
begin
  select coalesce(max(entry_number), 0) + 1 into next_number
  from public.participants
  where room_id = new.room_id;

  new.entry_number := next_number;
  return new;
end;
$$;

create trigger participants_assign_entry_number
  before insert on public.participants
  for each row execute function public.assign_entry_number();
