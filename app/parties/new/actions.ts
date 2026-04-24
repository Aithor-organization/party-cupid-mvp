// 방 생성 Server Action — Supabase rooms INSERT + 기본 4단계 stages INSERT
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/utils/room-code";

export type CreateRoomResult =
  | { ok: true; roomId: string; code: string }
  | { ok: false; error: string };

export async function createRoom(formData: FormData): Promise<CreateRoomResult> {
  const name = String(formData.get("name") ?? "").trim();
  const maxParticipants = Number(formData.get("max_participants") ?? 50);

  if (!name) return { ok: false, error: "파티 이름을 입력해 주세요" };
  if (name.length > 100) return { ok: false, error: "파티 이름은 100자 이내" };
  if (maxParticipants < 2 || maxParticipants > 200) {
    return { ok: false, error: "최대 인원은 2~200명 사이" };
  }

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "로그인이 필요합니다" };

  // 방 코드 생성 (충돌 시 최대 5회 재시도)
  let code = "";
  for (let i = 0; i < 5; i++) {
    code = generateRoomCode(6);
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    if (i === 4) return { ok: false, error: "방 코드 생성 실패 — 다시 시도해 주세요" };
  }

  // 1. rooms INSERT
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      code,
      host_id: user.id,
      name,
      max_participants: maxParticipants,
      status: "pending",
    })
    .select("id")
    .single();

  if (roomError || !room) {
    return { ok: false, error: `방 생성 실패: ${roomError?.message ?? "unknown"}` };
  }

  // 2. 기본 4단계 자동 생성 (사용자가 추후 H-13 편집 가능)
  const defaultStages = [
    { order: 1, name: "환영 인사", collect_vote: false, max_selections: 3, trigger_manual: true },
    { order: 2, name: "첫인상 투표", collect_vote: true, max_selections: 5, trigger_timer_minutes: 5, trigger_manual: true },
    { order: 3, name: "자기소개 시간", collect_vote: false, max_selections: 3, trigger_timer_minutes: 15, trigger_manual: true },
    { order: 4, name: "마지막 투표", collect_vote: true, max_selections: 3, trigger_timer_minutes: 5, trigger_all_voted: true, trigger_manual: true },
  ];

  const { error: stagesError } = await supabase
    .from("stages")
    .insert(defaultStages.map((s) => ({ ...s, room_id: room.id })));

  if (stagesError) {
    // rooms INSERT는 성공했으니 그대로 진행 (stages는 추후 빌더에서 보정)
    console.warn("[createRoom] stages INSERT 실패:", stagesError.message);
  }

  revalidatePath("/dashboard");
  return { ok: true, roomId: room.id, code };
}

export async function createRoomAndRedirect(formData: FormData) {
  const result = await createRoom(formData);
  if (!result.ok) {
    // Server Action에서 redirect 던지면 catch 됨 → URL 파라미터로 에러 전달
    redirect(`/parties/new?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/parties/${result.roomId}`);
}
