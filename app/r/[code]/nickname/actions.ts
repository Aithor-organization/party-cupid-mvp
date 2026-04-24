// 닉네임 입장 Server Action — anonymous auth + participants INSERT를 서버에서 처리
// 쿠키 동기화 보장 (클라이언트 timing 이슈 회피)
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EnterRoomResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export async function enterRoom(formData: FormData): Promise<EnterRoomResult> {
  const code = String(formData.get("code") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!code) return { ok: false, error: "방 코드 누락" };
  if (!nickname) return { ok: false, error: "닉네임을 입력해 주세요" };
  if (nickname.length > 20) return { ok: false, error: "닉네임은 20자 이내" };

  const supabase = createClient();

  // 1. 방 조회
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", code)
    .single();
  if (roomError || !room) {
    return { ok: false, error: "방을 찾을 수 없습니다" };
  }

  // 2. 기존 세션 확인 — 없으면 anonymous sign-in (서버에서 호출하면 쿠키 자동 설정)
  let { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError || !anonData.user) {
      return {
        ok: false,
        error: `Anonymous Sign-Ins가 비활성화되었습니다. Supabase Dashboard → Authentication → Providers → Anonymous → Enable. (${anonError?.message ?? "unknown"})`,
      };
    }
    user = anonData.user;
  }

  // 3. 이미 같은 방 참여자인지 확인
  const { data: existing } = await supabase
    .from("participants")
    .select("id, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .maybeSingle();

  if (existing) {
    // 활성 상태면 그대로 입장, 강퇴 상태면 차단
    if (existing.status === "active") {
      revalidatePath(`/r/${code}/home`);
      return { ok: true, redirectTo: `/r/${code}/home` };
    }
    if (existing.status === "kicked") {
      return { ok: false, error: "이 방에서 강퇴되었습니다" };
    }
  }

  // 4. participants INSERT (entry_number는 0008 trigger가 자동 할당)
  const { error: insertError } = await supabase.from("participants").insert({
    room_id: room.id,
    anon_user_id: user.id,
    nickname,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      // race: 이미 들어와 있음
      revalidatePath(`/r/${code}/home`);
      return { ok: true, redirectTo: `/r/${code}/home` };
    }
    if (insertError.code === "23502") {
      return {
        ok: false,
        error: "DB 마이그레이션 0008이 적용되지 않았습니다. SQL Editor에서 0008_auto_entry_number.sql 실행 필요.",
      };
    }
    return {
      ok: false,
      error: `입장 실패 (${insertError.code ?? "?"}): ${insertError.message}`,
    };
  }

  revalidatePath(`/r/${code}/home`);
  return { ok: true, redirectTo: `/r/${code}/home` };
}

/**
 * Form action wrapper — Server Action으로 직접 호출 시 사용
 * 결과 ok=true면 redirect, ok=false면 URL 파라미터로 에러 전달
 */
export async function enterRoomAndRedirect(formData: FormData) {
  const result = await enterRoom(formData);
  const code = String(formData.get("code") ?? "");
  if (!result.ok) {
    redirect(`/r/${code}/nickname?error=${encodeURIComponent(result.error)}`);
  }
  redirect(result.redirectTo);
}
