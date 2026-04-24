// 호스트 Server Actions — 단계 진행/강퇴/매칭 판정
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/**
 * 다음 단계로 진행
 * - 현재 active stage가 있으면 closed로 전환 + stage_run.closed_at 기록
 * - 다음 pending stage를 active로 + stage_run INSERT (run_number=1)
 * - 다음 단계가 없으면 → 마지막 → computeMatches() 호출 + 방 status='closed'
 */
export async function advanceStage(roomId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  // 호스트 권한 확인
  const { data: room } = await supabase
    .from("rooms")
    .select("id, host_id, status")
    .eq("id", roomId)
    .single();
  if (!room) return { ok: false, error: "방을 찾을 수 없습니다" };
  if (room.host_id !== user.id) return { ok: false, error: "호스트만 진행 가능합니다" };

  // 단계 목록 조회
  const { data: stages } = await supabase
    .from("stages")
    .select('id, "order", name, status, current_run_id')
    .eq("room_id", roomId)
    .order("order");

  if (!stages || stages.length === 0) return { ok: false, error: "단계가 없습니다" };

  const activeIdx = stages.findIndex((s) => s.status === "active");
  const currentStage = activeIdx >= 0 ? stages[activeIdx] : null;
  const nextStage = activeIdx >= 0 ? stages[activeIdx + 1] : stages[0];

  // 1. 현재 active stage 닫기
  if (currentStage) {
    if (currentStage.current_run_id) {
      await supabase
        .from("stage_runs")
        .update({ closed_at: new Date().toISOString() })
        .eq("id", currentStage.current_run_id);
    }
    await supabase
      .from("stages")
      .update({ status: "closed" })
      .eq("id", currentStage.id);
  }

  // 2. 다음 단계가 있으면 활성화
  if (nextStage) {
    const { data: newRun, error: runError } = await supabase
      .from("stage_runs")
      .insert({
        stage_id: nextStage.id,
        run_number: 1,
        mode: "normal",
        allow_join: true,
        is_final_for_matching: false, // 마지막 단계도 일단 false; 종료 시점에 매칭 판정
      })
      .select("id")
      .single();

    if (runError || !newRun) {
      return { ok: false, error: `stage_run 생성 실패: ${runError?.message ?? "unknown"}` };
    }

    await supabase
      .from("stages")
      .update({ status: "active", current_run_id: newRun.id })
      .eq("id", nextStage.id);

    // 방 상태 'pending' → 'live' (첫 단계 시작 시)
    if (room.status === "pending") {
      await supabase.from("rooms").update({ status: "live" }).eq("id", roomId);
    }

    revalidatePath(`/parties/${roomId}`);
    return { ok: true, message: `단계 진행: ${nextStage.name}` };
  }

  // 3. 다음 단계가 없음 → 파티 종료 + 매칭 판정
  const matchResult = await computeMatches(supabase, roomId);
  await supabase.from("rooms").update({ status: "closed" }).eq("id", roomId);

  revalidatePath(`/parties/${roomId}`);
  return {
    ok: true,
    message: matchResult.ok
      ? `파티 종료. ${matchResult.matchCount}쌍 매칭됨`
      : `파티 종료 (매칭 계산 실패: ${matchResult.error})`,
  };
}

/**
 * 참여자 강퇴
 */
export async function kickParticipant(
  roomId: string,
  participantId: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();
  if (!room) return { ok: false, error: "방을 찾을 수 없습니다" };
  if (room.host_id !== user.id) return { ok: false, error: "호스트만 강퇴 가능합니다" };

  const { error } = await supabase
    .from("participants")
    .update({ status: "kicked", kicked_at: new Date().toISOString() })
    .eq("id", participantId)
    .eq("room_id", roomId);

  if (error) return { ok: false, error: `강퇴 실패: ${error.message}` };

  revalidatePath(`/parties/${roomId}`);
  return { ok: true, message: "강퇴 완료" };
}

/**
 * 매칭 판정 — 모든 collect_vote 단계의 votes에서 양방향 ❤를 매칭으로 INSERT
 *
 * 알고리즘:
 * - votes 전체 fetch (host RLS로 방 전체 읽기 가능)
 * - 동일 단계 내에서 (voter, target) 쌍이 양방향이면 매칭
 * - 한 쌍이 여러 단계에서 매칭되면 가장 마지막 단계 기록
 * - participant_a < participant_b CHECK 제약 준수
 */
async function computeMatches(
  supabase: ReturnType<typeof createClient>,
  roomId: string,
): Promise<{ ok: true; matchCount: number } | { ok: false; error: string }> {
  // collect_vote=true 단계만 후보
  const { data: voteStages } = await supabase
    .from("stages")
    .select('id, "order"')
    .eq("room_id", roomId)
    .eq("collect_vote", true)
    .order("order");

  if (!voteStages || voteStages.length === 0) {
    return { ok: true, matchCount: 0 };
  }

  // 모든 stage_run id 수집
  const stageIds = voteStages.map((s) => s.id);
  const { data: stageRuns } = await supabase
    .from("stage_runs")
    .select("id, stage_id")
    .in("stage_id", stageIds);

  if (!stageRuns || stageRuns.length === 0) return { ok: true, matchCount: 0 };

  const runToStage = new Map(stageRuns.map((r) => [r.id, r.stage_id]));
  const runIds = stageRuns.map((r) => r.id);

  // 모든 votes fetch
  const { data: votes } = await supabase
    .from("votes")
    .select("stage_run_id, voter_id, target_id")
    .in("stage_run_id", runIds)
    .not("target_id", "is", null);

  if (!votes || votes.length === 0) return { ok: true, matchCount: 0 };

  // 양방향 ❤ 추출 — pairKey "min:max" + 단계ID 매핑
  const voteSet = new Set(votes.map((v) => `${v.stage_run_id}|${v.voter_id}|${v.target_id}`));
  const pairs = new Map<string, { a: string; b: string; stage_id: string; order: number }>();

  for (const v of votes) {
    if (!v.target_id) continue;
    const reverseKey = `${v.stage_run_id}|${v.target_id}|${v.voter_id}`;
    if (voteSet.has(reverseKey)) {
      const a = v.voter_id < v.target_id ? v.voter_id : v.target_id;
      const b = v.voter_id < v.target_id ? v.target_id : v.voter_id;
      const stage_id = runToStage.get(v.stage_run_id)!;
      const order = voteStages.find((s) => s.id === stage_id)?.order ?? 0;
      const pairKey = `${a}|${b}`;
      const existing = pairs.get(pairKey);
      if (!existing || existing.order < order) {
        pairs.set(pairKey, { a, b, stage_id, order });
      }
    }
  }

  if (pairs.size === 0) return { ok: true, matchCount: 0 };

  // 기존 matches 삭제 (재계산)
  await supabase.from("matches").delete().eq("room_id", roomId);

  // INSERT (RLS는 클라이언트 INSERT 차단이지만 service role이 아닌 사용자도 호스트면 가능?
  // 0002_rls_policies.sql에는 INSERT 정책이 없음 → 클라이언트 INSERT 불가
  // 따라서 service_role key로 INSERT 필요. 임시로 REST가 아닌 SQL 통해 우회 불가능.
  // → 0002에 호스트 INSERT 정책 추가 필요. 우선 시도하고 실패 시 에러 반환.

  const rows = Array.from(pairs.values()).map((p) => ({
    room_id: roomId,
    participant_a_id: p.a,
    participant_b_id: p.b,
    matched_stage_id: p.stage_id,
  }));

  const { error: insError } = await supabase.from("matches").insert(rows);
  if (insError) {
    return {
      ok: false,
      error: `matches INSERT 실패 (RLS 정책 추가 필요): ${insError.message}`,
    };
  }

  return { ok: true, matchCount: rows.length };
}

/**
 * 신고 처리 — resolved/dismissed로 상태 변경 + 메시지 hide / 참여자 강퇴
 */
export async function resolveReport(
  roomId: string,
  reportId: string,
  action: "resolve_hide" | "resolve_kick" | "dismiss",
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();
  if (!room || room.host_id !== user.id) return { ok: false, error: "권한 없음" };

  const { data: report } = await supabase
    .from("reports")
    .select("id, target_message_id, target_participant_id")
    .eq("id", reportId)
    .eq("room_id", roomId)
    .single();
  if (!report) return { ok: false, error: "신고를 찾을 수 없습니다" };

  if (action === "resolve_hide" && report.target_message_id) {
    await supabase
      .from("messages")
      .update({ is_hidden: true, is_reported: true })
      .eq("id", report.target_message_id);
  }
  if (action === "resolve_kick" && report.target_participant_id) {
    await supabase
      .from("participants")
      .update({ status: "kicked", kicked_at: new Date().toISOString() })
      .eq("id", report.target_participant_id);
  }

  const newStatus = action === "dismiss" ? "dismissed" : "resolved";
  const { error } = await supabase
    .from("reports")
    .update({ status: newStatus })
    .eq("id", reportId);
  if (error) return { ok: false, error: `처리 실패: ${error.message}` };

  revalidatePath(`/parties/${roomId}/reports`);
  return { ok: true, message: "처리 완료" };
}

/**
 * 단계 편집 — 이름/투표 토글/한도 변경 (active/closed 단계는 잠금)
 */
export async function updateStage(
  roomId: string,
  stageId: string,
  patch: { name?: string; collect_vote?: boolean; max_selections?: number },
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();
  if (!room || room.host_id !== user.id) return { ok: false, error: "권한 없음" };

  const { data: stage } = await supabase
    .from("stages")
    .select("status, room_id")
    .eq("id", stageId)
    .single();
  if (!stage || stage.room_id !== roomId) return { ok: false, error: "단계를 찾을 수 없습니다" };
  if (stage.status === "active") return { ok: false, error: "진행 중인 단계는 수정 불가" };
  if (stage.status === "closed") return { ok: false, error: "종료된 단계는 수정 불가" };

  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) return { ok: false, error: "이름은 비울 수 없습니다" };
    if (trimmed.length > 100) return { ok: false, error: "이름은 100자 이내" };
    update.name = trimmed;
  }
  if (patch.collect_vote !== undefined) update.collect_vote = patch.collect_vote;
  if (patch.max_selections !== undefined) {
    if (patch.max_selections < 1 || patch.max_selections > 10) {
      return { ok: false, error: "최대 선택 수는 1~10" };
    }
    update.max_selections = patch.max_selections;
  }

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from("stages").update(update).eq("id", stageId);
  if (error) return { ok: false, error: `수정 실패: ${error.message}` };

  revalidatePath(`/parties/${roomId}/stages`);
  revalidatePath(`/parties/${roomId}`);
  return { ok: true };
}

/**
 * 단계 추가 — 끝에 추가
 */
export async function addStage(
  roomId: string,
  patch: { name: string; collect_vote: boolean; max_selections?: number },
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();
  if (!room || room.host_id !== user.id) return { ok: false, error: "권한 없음" };

  const name = patch.name.trim();
  if (!name) return { ok: false, error: "이름을 입력해 주세요" };
  if (name.length > 100) return { ok: false, error: "이름은 100자 이내" };

  // 마지막 order 조회
  const { data: lastStage } = await supabase
    .from("stages")
    .select('"order"')
    .eq("room_id", roomId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (lastStage?.order ?? 0) + 1;

  const { error } = await supabase.from("stages").insert({
    room_id: roomId,
    order: nextOrder,
    name,
    collect_vote: patch.collect_vote,
    max_selections: patch.max_selections ?? 3,
    trigger_manual: true,
  });
  if (error) return { ok: false, error: `추가 실패: ${error.message}` };

  revalidatePath(`/parties/${roomId}/stages`);
  revalidatePath(`/parties/${roomId}`);
  return { ok: true };
}

/**
 * 단계 위/아래 이동 — pending 단계만 가능, 인접 단계와 order 스왑
 */
export async function moveStage(
  roomId: string,
  stageId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();
  if (!room || room.host_id !== user.id) return { ok: false, error: "권한 없음" };

  const { data: stages } = await supabase
    .from("stages")
    .select('id, "order", status')
    .eq("room_id", roomId)
    .order("order");
  if (!stages || stages.length < 2) return { ok: false, error: "이동할 단계가 부족합니다" };

  const idx = stages.findIndex((s) => s.id === stageId);
  if (idx === -1) return { ok: false, error: "단계를 찾을 수 없습니다" };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= stages.length) {
    return { ok: false, error: "더 이상 이동할 수 없습니다" };
  }

  const me = stages[idx];
  const other = stages[swapIdx];
  if (me.status !== "pending" || other.status !== "pending") {
    return { ok: false, error: "준비 단계끼리만 순서 변경 가능" };
  }

  // unique (room_id, order) 제약 회피: 임시 음수 order로 이동
  const TMP = -1 - me.order;
  await supabase.from("stages").update({ order: TMP }).eq("id", me.id);
  await supabase.from("stages").update({ order: me.order }).eq("id", other.id);
  await supabase.from("stages").update({ order: other.order }).eq("id", me.id);

  revalidatePath(`/parties/${roomId}/stages`);
  revalidatePath(`/parties/${roomId}`);
  return { ok: true };
}

/**
 * 단계 삭제 — pending 상태만 삭제 가능
 */
export async function deleteStage(
  roomId: string,
  stageId: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();
  if (!room || room.host_id !== user.id) return { ok: false, error: "권한 없음" };

  const { data: stage } = await supabase
    .from("stages")
    .select("status, room_id")
    .eq("id", stageId)
    .single();
  if (!stage || stage.room_id !== roomId) return { ok: false, error: "단계를 찾을 수 없습니다" };
  if (stage.status !== "pending") return { ok: false, error: "준비 단계만 삭제 가능" };

  const { error } = await supabase.from("stages").delete().eq("id", stageId);
  if (error) return { ok: false, error: `삭제 실패: ${error.message}` };

  revalidatePath(`/parties/${roomId}/stages`);
  revalidatePath(`/parties/${roomId}`);
  return { ok: true };
}

/**
 * 파티 강제 종료
 */
export async function forceCloseRoom(roomId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다" };

  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single();
  if (!room || room.host_id !== user.id) return { ok: false, error: "권한 없음" };

  // 활성 stage_run 닫기
  const { data: activeStages } = await supabase
    .from("stages")
    .select("id, current_run_id")
    .eq("room_id", roomId)
    .eq("status", "active");

  for (const s of activeStages ?? []) {
    if (s.current_run_id) {
      await supabase
        .from("stage_runs")
        .update({ closed_at: new Date().toISOString() })
        .eq("id", s.current_run_id);
    }
    await supabase.from("stages").update({ status: "closed" }).eq("id", s.id);
  }

  // 매칭 판정
  await computeMatches(supabase, roomId);
  await supabase.from("rooms").update({ status: "closed" }).eq("id", roomId);

  revalidatePath(`/parties/${roomId}`);
  return { ok: true, message: "파티 강제 종료 + 매칭 판정 완료" };
}
