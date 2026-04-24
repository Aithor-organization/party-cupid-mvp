-- Party Cupid MVP — RLS 정책 (v6 기획서 4.14)
-- 적용: 0001 이후 실행. 모든 테이블 RLS enable + 권한 정책 설정.

-- =============================================================================
-- RLS Enable
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.rooms         enable row level security;
alter table public.stages        enable row level security;
alter table public.stage_runs    enable row level security;
alter table public.participants  enable row level security;
alter table public.votes         enable row level security;
alter table public.matches       enable row level security;
alter table public.messages      enable row level security;
alter table public.reports       enable row level security;

-- =============================================================================
-- profiles
-- =============================================================================
create policy "profiles: 본인만 read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: 본인만 update"
  on public.profiles for update
  using (auth.uid() = id);

-- =============================================================================
-- rooms
-- =============================================================================
-- 호스트는 자기 방 모든 작업 가능
create policy "rooms: 호스트만 insert"
  on public.rooms for insert
  with check (auth.uid() = host_id);

create policy "rooms: 호스트만 update"
  on public.rooms for update
  using (auth.uid() = host_id);

create policy "rooms: 호스트만 delete"
  on public.rooms for delete
  using (auth.uid() = host_id);

-- 누구나 방 정보 read 가능 (참여자 입장용 — code로 조회)
create policy "rooms: public read"
  on public.rooms for select
  using (true);

-- =============================================================================
-- stages, stage_runs (호스트만 관리, 참여자는 read)
-- =============================================================================
create policy "stages: 호스트만 write"
  on public.stages for all
  using (room_id in (select id from public.rooms where host_id = auth.uid()))
  with check (room_id in (select id from public.rooms where host_id = auth.uid()));

create policy "stages: public read"
  on public.stages for select
  using (true);

create policy "stage_runs: 호스트만 write"
  on public.stage_runs for all
  using (stage_id in (
    select s.id from public.stages s
    join public.rooms r on r.id = s.room_id
    where r.host_id = auth.uid()
  ))
  with check (stage_id in (
    select s.id from public.stages s
    join public.rooms r on r.id = s.room_id
    where r.host_id = auth.uid()
  ));

create policy "stage_runs: public read"
  on public.stage_runs for select
  using (true);

-- =============================================================================
-- participants
-- =============================================================================
-- 본인만 자기 row insert (anonymous auth jwt sub와 매핑)
create policy "participants: 본인만 insert"
  on public.participants for insert
  with check (anon_user_id = auth.uid());

-- 같은 방 참여자끼리 닉네임만 read (실명/이메일 추가 정보 X — 컬럼 자체에 없음)
create policy "participants: 같은 방 참여자 read"
  on public.participants for select
  using (
    room_id in (
      select room_id from public.participants where anon_user_id = auth.uid()
    )
  );

-- 호스트는 자기 방 participants 전체 read
create policy "participants: 호스트 전체 read"
  on public.participants for select
  using (
    room_id in (select id from public.rooms where host_id = auth.uid())
  );

-- 호스트는 강퇴 가능 (status update)
create policy "participants: 호스트만 update (강퇴)"
  on public.participants for update
  using (
    room_id in (select id from public.rooms where host_id = auth.uid())
  );

-- =============================================================================
-- votes (영구 잠금 — UPDATE/DELETE 정책 의도적으로 미생성 = 기본 deny)
-- =============================================================================
-- 본인만 자기 투표 INSERT (자기 자신 차단은 CHECK 제약으로 이미 강제)
create policy "votes: 본인 투표만 insert"
  on public.votes for insert
  with check (
    voter_id in (
      select id from public.participants where anon_user_id = auth.uid()
    )
  );

-- 본인의 투표만 read (참여자 시점에서는 익명성 보장)
create policy "votes: 본인 투표 read"
  on public.votes for select
  using (
    voter_id in (
      select id from public.participants where anon_user_id = auth.uid()
    )
  );

-- 호스트는 자기 방 votes 전체 read (실명 매핑 가능)
create policy "votes: 호스트 전체 read"
  on public.votes for select
  using (
    stage_run_id in (
      select sr.id from public.stage_runs sr
      join public.stages s on s.id = sr.stage_id
      join public.rooms r on r.id = s.room_id
      where r.host_id = auth.uid()
    )
  );

-- =============================================================================
-- matches (서버 함수만 INSERT, 참여자/호스트 read)
-- =============================================================================
create policy "matches: 본인 매칭 read"
  on public.matches for select
  using (
    participant_a_id in (select id from public.participants where anon_user_id = auth.uid())
    or
    participant_b_id in (select id from public.participants where anon_user_id = auth.uid())
  );

create policy "matches: 호스트 전체 read"
  on public.matches for select
  using (
    room_id in (select id from public.rooms where host_id = auth.uid())
  );

-- INSERT 정책 미생성 = 클라이언트 INSERT 차단 (Edge Function service_role만 가능)

-- =============================================================================
-- messages
-- =============================================================================
-- 본인이 sender인 경우만 INSERT (양방향 매칭 검증은 추후 trigger 또는 Edge Function)
create policy "messages: 본인만 insert"
  on public.messages for insert
  with check (
    sender_id in (select id from public.participants where anon_user_id = auth.uid())
  );

-- 송수신자 본인만 read
create policy "messages: 송수신자 read"
  on public.messages for select
  using (
    sender_id in (select id from public.participants where anon_user_id = auth.uid())
    or
    receiver_id in (select id from public.participants where anon_user_id = auth.uid())
  );

-- 호스트는 자기 방 messages 전체 read (신고 처리용)
create policy "messages: 호스트 전체 read"
  on public.messages for select
  using (
    room_id in (select id from public.rooms where host_id = auth.uid())
  );

-- 호스트는 messages hide 가능
create policy "messages: 호스트 update (hide)"
  on public.messages for update
  using (
    room_id in (select id from public.rooms where host_id = auth.uid())
  );

-- =============================================================================
-- reports
-- =============================================================================
create policy "reports: 본인만 insert"
  on public.reports for insert
  with check (
    reporter_id in (select id from public.participants where anon_user_id = auth.uid())
  );

create policy "reports: 호스트만 read/update"
  on public.reports for all
  using (
    room_id in (select id from public.rooms where host_id = auth.uid())
  );
