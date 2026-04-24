// 대시보드 Server Actions — 파티 삭제
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeleteRoomResult = { ok: true } | { ok: false; error: string };

/**
 * 파티 삭제 — 호스트 본인의 방만 삭제 가능
 * CASCADE 설정으로 stages/participants/votes/matches/messages 자동 삭제
 */
export async function deleteRoom(roomId: string): Promise<DeleteRoomResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  // 호스트 권한 확인 (RLS도 차단하지만 명시적으로)
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, host_id, status, name")
    .eq("id", roomId)
    .single();
  if (roomError || !room) return { ok: false, error: "방을 찾을 수 없습니다" };
  if (room.host_id !== user.id) return { ok: false, error: "본인의 방만 삭제 가능합니다" };

  // LIVE 방은 먼저 종료해야 함 (안전 가드)
  if (room.status === "live") {
    return {
      ok: false,
      error: "진행 중인 파티는 먼저 강제 종료해야 삭제 가능합니다",
    };
  }

  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) return { ok: false, error: `삭제 실패: ${error.message}` };

  revalidatePath("/dashboard");
  return { ok: true };
}
