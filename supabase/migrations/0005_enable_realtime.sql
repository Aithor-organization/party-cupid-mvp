-- Party Cupid MVP — Realtime publication 활성화
-- 클라이언트 RealtimeRefresh 컴포넌트가 postgres_changes 이벤트를 수신하기 위해 필요.
-- RLS는 별도로 적용되므로 본인이 read 가능한 row의 변경만 클라이언트에 전달됨.

alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.stages;
alter publication supabase_realtime add table public.stage_runs;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.messages;
