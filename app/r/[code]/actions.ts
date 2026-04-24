// 참여자 Server Actions — 투표(❤) 토글
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToggleHeartResult =
  | { ok: true; hearted: boolean; remaining: number }
  | { ok: false; error: string };

/**
 * 호감도 ❤ 토글 — 현재 활성 stage_run에 votes INSERT 또는 DELETE
 *
 * 규칙:
 * - 활성 stage_run + collect_vote=true 인 단계에서만 가능
 * - max_selections 한도 검증
 * - 자기 자신 투표 차단 (DB CHECK + RLS 검증)
 * - is_locked=true 인 단계에서는 변경 불가
 */
export async function toggleHeart(
  roomCode: string,
  targetParticipantId: string,
): Promise<ToggleHeartResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  // 1. 방 + 본인 participant id 조회
  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", roomCode)
    .single();
  if (!room) return { ok: false, error: "방을 찾을 수 없습니다" };

  const { data: me } = await supabase
    .from("participants")
    .select("id, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .single();
  if (!me || me.status !== "active") return { ok: false, error: "참여자 상태가 아닙니다" };

  if (me.id === targetParticipantId) return { ok: false, error: "본인에게는 ❤할 수 없습니다" };

  // 2. 현재 활성 stage + active stage_run 조회 (collect_vote=true)
  const { data: activeStages } = await supabase
    .from("stages")
    .select('id, "order", name, collect_vote, max_selections, status, current_run_id')
    .eq("room_id", room.id)
    .eq("status", "active")
    .eq("collect_vote", true)
    .limit(1);

  const activeStage = activeStages?.[0];
  if (!activeStage) return { ok: false, error: "현재 투표 단계가 아닙니다" };
  if (!activeStage.current_run_id) return { ok: false, error: "활성 투표 세션이 없습니다" };

  const { data: stageRun } = await supabase
    .from("stage_runs")
    .select("id, closed_at")
    .eq("id", activeStage.current_run_id)
    .single();
  if (!stageRun || stageRun.closed_at) return { ok: false, error: "마감된 투표입니다" };

  // 3. 기존 투표 확인
  const { data: existing } = await supabase
    .from("votes")
    .select("id, is_locked")
    .eq("stage_run_id", stageRun.id)
    .eq("voter_id", me.id)
    .eq("target_id", targetParticipantId)
    .maybeSingle();

  if (existing) {
    // 토글 OFF — DELETE (RLS 정책상 본인 vote만 삭제 가능; 잠금 시 차단)
    if (existing.is_locked) return { ok: false, error: "잠긴 투표는 변경할 수 없습니다" };
    const { error: delError } = await supabase.from("votes").delete().eq("id", existing.id);
    if (delError) return { ok: false, error: `취소 실패: ${delError.message}` };
    const remaining = await countRemaining(supabase, stageRun.id, me.id, activeStage.max_selections);
    revalidatePath(`/r/${roomCode}/people`);
    revalidatePath(`/r/${roomCode}/people/${targetParticipantId}`);
    return { ok: true, hearted: false, remaining };
  }

  // 4. 한도 검증 (현재 stage_run 내 본인 투표 수)
  const { count: currentCount } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("stage_run_id", stageRun.id)
    .eq("voter_id", me.id);

  if ((currentCount ?? 0) >= activeStage.max_selections) {
    return {
      ok: false,
      error: `최대 ${activeStage.max_selections}명까지 ❤할 수 있습니다`,
    };
  }

  // 5. INSERT (UNIQUE (stage_run_id, voter_id, target_id) 제약으로 중복/race 차단)
  const { error: insError } = await supabase.from("votes").insert({
    stage_run_id: stageRun.id,
    voter_id: me.id,
    target_id: targetParticipantId,
    is_locked: false,
  });

  if (insError) {
    // 23505 = unique_violation → 중복 클릭/race condition
    if (insError.code === "23505") {
      return { ok: false, error: "이미 ❤한 상대입니다 (중복 요청)" };
    }
    return { ok: false, error: `투표 실패: ${insError.message}` };
  }

  const remaining = await countRemaining(supabase, stageRun.id, me.id, activeStage.max_selections);
  revalidatePath(`/r/${roomCode}/people`);
  revalidatePath(`/r/${roomCode}/people/${targetParticipantId}`);
  return { ok: true, hearted: true, remaining };
}

async function countRemaining(
  supabase: ReturnType<typeof createClient>,
  stageRunId: string,
  voterId: string,
  maxSelections: number,
): Promise<number> {
  const { count } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("stage_run_id", stageRunId)
    .eq("voter_id", voterId);
  return Math.max(0, maxSelections - (count ?? 0));
}

// =============================================================================
// 쪽지 보내기 — 양방향 매칭된 상대에게만 가능
// =============================================================================

export type SendMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendMessage(
  roomCode: string,
  receiverParticipantId: string,
  body: string,
): Promise<SendMessageResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "내용을 입력해 주세요" };
  if (trimmed.length > 500) return { ok: false, error: "500자 이내로 작성해 주세요" };

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", roomCode)
    .single();
  if (!room) return { ok: false, error: "방을 찾을 수 없습니다" };

  const { data: me } = await supabase
    .from("participants")
    .select("id, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .single();
  if (!me || me.status !== "active") return { ok: false, error: "참여자 상태가 아닙니다" };

  // 양방향 매칭 검증
  const a = me.id < receiverParticipantId ? me.id : receiverParticipantId;
  const b = me.id < receiverParticipantId ? receiverParticipantId : me.id;
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("room_id", room.id)
    .eq("participant_a_id", a)
    .eq("participant_b_id", b)
    .maybeSingle();
  if (!match) return { ok: false, error: "양방향 매칭된 상대에게만 보낼 수 있습니다" };

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      room_id: room.id,
      sender_id: me.id,
      receiver_id: receiverParticipantId,
      body: trimmed,
    })
    .select("id")
    .single();

  if (error || !msg) return { ok: false, error: `전송 실패: ${error?.message ?? "unknown"}` };

  revalidatePath(`/r/${roomCode}/messages`);
  return { ok: true, messageId: msg.id };
}

// =============================================================================
// 신고 — 참여자 또는 메시지 신고
// =============================================================================

// =============================================================================
// 본인 닉네임 변경
// =============================================================================

export type UpdateNicknameResult = { ok: true } | { ok: false; error: string };

export async function updateMyNickname(
  roomCode: string,
  newNickname: string,
): Promise<UpdateNicknameResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const trimmed = newNickname.trim();
  if (!trimmed) return { ok: false, error: "닉네임을 입력해 주세요" };
  if (trimmed.length > 20) return { ok: false, error: "닉네임은 20자 이내" };

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", roomCode)
    .single();
  if (!room) return { ok: false, error: "방을 찾을 수 없습니다" };

  const { error } = await supabase
    .from("participants")
    .update({ nickname: trimmed })
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id);
  if (error) return { ok: false, error: `변경 실패: ${error.message}` };

  revalidatePath(`/r/${roomCode}/home`);
  revalidatePath(`/r/${roomCode}/me`);
  return { ok: true };
}

// =============================================================================
// 방 나가기 — status=left로 업데이트 (실제 row 삭제 안함)
// =============================================================================

export type LeaveRoomResult = { ok: true } | { ok: false; error: string };

export async function leaveRoom(roomCode: string): Promise<LeaveRoomResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", roomCode)
    .single();
  if (!room) return { ok: false, error: "방을 찾을 수 없습니다" };

  const { error } = await supabase
    .from("participants")
    .update({ status: "left" })
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id);
  if (error) return { ok: false, error: `나가기 실패: ${error.message}` };

  revalidatePath(`/r/${roomCode}/home`);
  return { ok: true };
}

export type ReportResult = { ok: true } | { ok: false; error: string };

export async function reportTarget(
  roomCode: string,
  args: {
    targetParticipantId?: string;
    targetMessageId?: string;
    reason: string;
  },
): Promise<ReportResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const reason = args.reason.trim();
  if (!reason) return { ok: false, error: "신고 사유를 입력해 주세요" };
  if (reason.length > 500) return { ok: false, error: "500자 이내로 작성해 주세요" };
  if (!args.targetParticipantId && !args.targetMessageId) {
    return { ok: false, error: "신고 대상이 없습니다" };
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", roomCode)
    .single();
  if (!room) return { ok: false, error: "방을 찾을 수 없습니다" };

  const { data: me } = await supabase
    .from("participants")
    .select("id, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .single();
  if (!me || me.status !== "active") return { ok: false, error: "참여자 상태가 아닙니다" };

  const { error } = await supabase.from("reports").insert({
    room_id: room.id,
    reporter_id: me.id,
    target_participant_id: args.targetParticipantId ?? null,
    target_message_id: args.targetMessageId ?? null,
    reason,
  });
  if (error) return { ok: false, error: `신고 실패: ${error.message}` };

  revalidatePath(`/r/${roomCode}/people`);
  revalidatePath(`/r/${roomCode}/messages`);
  return { ok: true };
}
