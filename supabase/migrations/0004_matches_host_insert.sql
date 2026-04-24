-- Party Cupid MVP — matches INSERT 정책 추가 (호스트가 자기 방 매칭 INSERT 가능)
-- 0002에서는 INSERT 정책을 의도적으로 미생성했으나, MVP에서는 Server Action을
-- 호스트 세션으로 호출하므로 호스트만 자기 방에 INSERT 허용.

create policy "matches: 호스트만 insert"
  on public.matches for insert
  with check (
    room_id in (select id from public.rooms where host_id = auth.uid())
  );

create policy "matches: 호스트만 delete (재계산용)"
  on public.matches for delete
  using (
    room_id in (select id from public.rooms where host_id = auth.uid())
  );
