-- Party Cupid MVP — Codex Adversarial Review 보안 수정 (4개 critical/high)
-- 출처: 2026-04-24 Codex 적대적 리뷰
-- 1. [CRITICAL] votes race condition + UNIQUE 누락
-- 2. [CRITICAL] messages RLS가 sender만 검증 (room/receiver/match 미검증)
-- 3. [HIGH] votes DELETE 정책 부재로 toggle off 불가
-- 4. [HIGH] matches 재계산 비원자적 + UNIQUE 부재

-- =============================================================================
-- FIX 1: votes UNIQUE 제약 + DELETE 정책
-- =============================================================================

-- 1-1. UNIQUE 제약 (동일 voter가 같은 stage_run에서 같은 target에 중복 vote 차단)
alter table public.votes
  add constraint votes_uniq_per_run unique (stage_run_id, voter_id, target_id);

-- 1-2. DELETE 정책 (본인 vote만 삭제, is_locked=false인 경우만)
create policy "votes: 본인 vote만 delete (잠금 전)"
  on public.votes for delete
  using (
    voter_id in (
      select id from public.participants where anon_user_id = auth.uid()
    )
    and is_locked = false
  );

-- =============================================================================
-- FIX 2: messages RLS 강화 (room + receiver 같은 방 + matches 존재 검증)
-- =============================================================================

drop policy if exists "messages: 본인만 insert" on public.messages;

create policy "messages: 매칭된 상대에게만 insert"
  on public.messages for insert
  with check (
    -- 본인이 sender
    sender_id in (
      select id from public.participants where anon_user_id = auth.uid()
    )
    -- room_id가 sender의 room과 일치
    and room_id in (
      select room_id from public.participants
      where anon_user_id = auth.uid() and id = sender_id
    )
    -- receiver도 같은 방 참여자
    and receiver_id in (
      select id from public.participants where room_id = messages.room_id
    )
    -- 양방향 매칭 존재 (a/b 정렬: 작은 id가 participant_a)
    and exists (
      select 1 from public.matches m
      where m.room_id = messages.room_id
        and (
          (m.participant_a_id = least(sender_id, receiver_id)
           and m.participant_b_id = greatest(sender_id, receiver_id))
        )
    )
  );

-- =============================================================================
-- FIX 4: matches UNIQUE 제약 (재계산 시 중복 차단)
-- =============================================================================

alter table public.matches
  add constraint matches_uniq_per_room unique (room_id, participant_a_id, participant_b_id);

-- =============================================================================
-- FIX 4 cont: 매칭 재계산 SECURITY DEFINER 함수 (원자적 + advisory lock)
-- =============================================================================

create or replace function public.recompute_matches(p_room_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted int := 0;
  v_lock_key bigint;
begin
  -- 호스트 권한 확인
  if not exists (
    select 1 from public.rooms
    where id = p_room_id and host_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  -- room_id 기반 advisory lock (동시 재계산 차단)
  v_lock_key := ('x' || substr(md5(p_room_id::text), 1, 16))::bit(64)::bigint;
  perform pg_advisory_xact_lock(v_lock_key);

  -- 트랜잭션 내에서 delete + insert
  delete from public.matches where room_id = p_room_id;

  insert into public.matches (room_id, participant_a_id, participant_b_id, matched_stage_id)
  select distinct
    p_room_id,
    least(v1.voter_id, v1.target_id) as a,
    greatest(v1.voter_id, v1.target_id) as b,
    s.id as matched_stage_id
  from public.votes v1
  join public.votes v2
    on v1.stage_run_id = v2.stage_run_id
    and v1.voter_id = v2.target_id
    and v1.target_id = v2.voter_id
    and v1.target_id is not null
  join public.stage_runs sr on sr.id = v1.stage_run_id
  join public.stages s on s.id = sr.stage_id
  where s.room_id = p_room_id
    and s.collect_vote = true
    and v1.target_id is not null
  on conflict (room_id, participant_a_id, participant_b_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.recompute_matches(uuid) from public;
grant execute on function public.recompute_matches(uuid) to authenticated;

comment on function public.recompute_matches(uuid) is
  '매칭 원자적 재계산. advisory lock + ON CONFLICT로 중복/race 차단. 호스트만 호출.';

-- =============================================================================
-- 운영 노트:
-- - Server Action computeMatches()는 다음 PR에서 supabase.rpc("recompute_matches", { p_room_id })로 전환
-- - 그 전까지는 기존 코드도 ON CONFLICT 덕분에 중복 INSERT 안 발생 (UNIQUE 제약이 막음)
-- - 투표 한도 검증은 여전히 Server Action에 있으나 UNIQUE 제약이 동일 target 중복은 100% 차단
--   → 한도 초과는 max_selections + 1번째 시도가 실패 (응답 에러로 사용자에게 표시)
