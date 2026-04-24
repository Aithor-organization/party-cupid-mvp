-- Party Cupid MVP — participants.entry_number 자동 할당 트리거
-- 문제: entry_number가 NOT NULL인데 클라이언트가 채우지 않음 → INSERT 실패 (23502)
-- 해결: BEFORE INSERT 트리거가 자동으로 (방 내 max + 1) 할당
-- race condition 방어: advisory lock으로 동시 INSERT 직렬화

create or replace function public.assign_entry_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock_key bigint;
begin
  if new.entry_number is null then
    -- room_id 기반 advisory lock (동시 INSERT 시 entry_number 충돌 방지)
    v_lock_key := ('x' || substr(md5(new.room_id::text), 1, 16))::bit(64)::bigint;
    perform pg_advisory_xact_lock(v_lock_key);

    select coalesce(max(entry_number), 0) + 1
      into new.entry_number
      from public.participants
      where room_id = new.room_id;
  end if;
  return new;
end;
$$;

drop trigger if exists participants_assign_entry_number on public.participants;
create trigger participants_assign_entry_number
  before insert on public.participants
  for each row execute function public.assign_entry_number();

comment on function public.assign_entry_number() is
  'participants INSERT 시 entry_number 자동 할당. room 내 max+1, advisory lock으로 race 방어.';
