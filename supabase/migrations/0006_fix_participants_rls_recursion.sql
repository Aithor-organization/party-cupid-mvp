-- Party Cupid MVP — participants RLS 무한 재귀 수정
-- 문제: "participants: 같은 방 참여자 read" 정책이 같은 participants 테이블을 SELECT
--       → Postgres가 이 SELECT 평가 시 RLS 정책 재호출 → infinite recursion
-- 해결: SECURITY DEFINER 함수로 RLS 우회하여 본인 room_id 조회

-- 1. helper function: 본인이 참여 중인 방 id 목록 (RLS bypass)
create or replace function public.user_room_ids(uid uuid)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select room_id from public.participants where anon_user_id = uid;
$$;

revoke all on function public.user_room_ids(uuid) from public;
grant execute on function public.user_room_ids(uuid) to authenticated, anon;

-- 2. 기존 재귀 정책 제거 후 함수 기반으로 재작성
drop policy if exists "participants: 같은 방 참여자 read" on public.participants;

create policy "participants: 같은 방 참여자 read"
  on public.participants for select
  using (room_id in (select public.user_room_ids(auth.uid())));

-- 3. votes 정책도 같은 패턴으로 잠재적 재귀 방어
--    (votes 정책은 participants를 SELECT하므로 위 함수 도입 후 자동 해소되지만 명시적으로 재작성)
drop policy if exists "votes: 본인 투표만 insert" on public.votes;
drop policy if exists "votes: 본인 투표 read" on public.votes;

create policy "votes: 본인 투표만 insert"
  on public.votes for insert
  with check (
    voter_id in (
      select id from public.participants
      where anon_user_id = auth.uid()
    )
  );

create policy "votes: 본인 투표 read"
  on public.votes for select
  using (
    voter_id in (
      select id from public.participants
      where anon_user_id = auth.uid()
    )
  );

-- 위 votes 정책은 participants를 SELECT하지만, participants의 호스트 read 정책 또는
-- 위에서 새로 만든 같은 방 read 정책이 SECURITY DEFINER 함수를 사용하므로 재귀 없음.

-- 4. matches/messages 정책도 같은 이유로 안전 — participants를 참조하지만
--    participants RLS가 더 이상 자기 참조하지 않으므로 OK.

comment on function public.user_room_ids(uuid) is
  'RLS 무한 재귀 회피용 helper. SECURITY DEFINER로 participants 직접 조회.';
