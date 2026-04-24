-- Party Cupid MVP — Initial Schema (v6 기반)
-- 적용 방법: Supabase 대시보드 → SQL Editor → 새 쿼리 → 이 파일 내용 붙여넣기 → Run
-- 또는: supabase db push (Supabase CLI 사용 시)

-- =============================================================================
-- profiles (주최자 추가 정보)
-- =============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is '주최자 추가 정보. auth.users INSERT 시 trigger로 자동 생성';

-- =============================================================================
-- rooms (파티방)
-- =============================================================================
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                          -- QR URL용 짧은 코드 (6-8자)
  host_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  max_participants int not null default 50,
  status text not null default 'pending' check (status in ('pending','live','editing','closed')),
  is_locked_for_editing boolean not null default false,
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rooms_host_id on public.rooms(host_id);
create index idx_rooms_code on public.rooms(code);

comment on column public.rooms.code is 'QR URL에 사용되는 짧은 공개 코드. 예: ABC123';

-- =============================================================================
-- stages (단계 배열)
-- =============================================================================
create table public.stages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  "order" int not null,
  name text not null,
  description text,
  collect_vote boolean not null default false,
  max_selections int not null default 3 check (max_selections between 1 and 10),
  trigger_timer_minutes int,
  trigger_all_voted boolean not null default false,
  trigger_manual boolean not null default true,
  status text not null default 'pending' check (status in ('pending','active','closed','reopened','view-only','deleted')),
  current_run_id uuid,                                -- 현재 활성 stage_run (FK는 순환참조 회피 위해 미설정)
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, "order")
);

create index idx_stages_room_id on public.stages(room_id);

-- =============================================================================
-- stage_runs (재오픈 추적)
-- =============================================================================
create table public.stage_runs (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  run_number int not null default 1,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  mode text not null default 'normal' check (mode in ('normal','reopened','view-only')),
  allow_join boolean not null default true,
  is_final_for_matching boolean not null default false,
  unique (stage_id, run_number)
);

create index idx_stage_runs_stage_id on public.stage_runs(stage_id);

-- =============================================================================
-- participants (방 참여자, anonymous auth 매핑)
-- =============================================================================
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  anon_user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (length(nickname) between 1 and 20),
  entry_number int not null,
  status text not null default 'active' check (status in ('active','kicked','left')),
  kicked_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (room_id, anon_user_id)
);

create index idx_participants_room_id on public.participants(room_id);

-- =============================================================================
-- votes (호감도 ❤, 영구 잠금)
-- =============================================================================
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  stage_run_id uuid not null references public.stage_runs(id) on delete cascade,
  voter_id uuid not null references public.participants(id) on delete cascade,
  target_id uuid references public.participants(id) on delete cascade,  -- nullable = "투표 안 함"
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  check (voter_id is distinct from target_id)         -- 자기 자신 투표 차단 (4.10)
);

create index idx_votes_stage_run on public.votes(stage_run_id);
create index idx_votes_voter on public.votes(voter_id);
create index idx_votes_target on public.votes(target_id);

-- =============================================================================
-- matches (양방향 매칭 결과)
-- =============================================================================
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_a_id uuid not null references public.participants(id) on delete cascade,
  participant_b_id uuid not null references public.participants(id) on delete cascade,
  matched_stage_id uuid not null references public.stages(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (participant_a_id < participant_b_id)         -- 중복 방지: (a,b)와 (b,a) 둘 중 하나만
);

create index idx_matches_room on public.matches(room_id);

-- =============================================================================
-- messages (양방향 매칭 후 익명 쪽지)
-- =============================================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id uuid not null references public.participants(id) on delete cascade,
  receiver_id uuid not null references public.participants(id) on delete cascade,
  body text not null check (length(body) between 1 and 500),
  is_reported boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_messages_room on public.messages(room_id);
create index idx_messages_receiver on public.messages(receiver_id);

-- =============================================================================
-- reports (신고)
-- =============================================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  reporter_id uuid not null references public.participants(id) on delete cascade,
  target_participant_id uuid references public.participants(id) on delete cascade,
  target_message_id uuid references public.messages(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index idx_reports_room on public.reports(room_id);

-- =============================================================================
-- updated_at 자동 갱신 트리거
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger rooms_set_updated_at before update on public.rooms
  for each row execute function public.set_updated_at();
