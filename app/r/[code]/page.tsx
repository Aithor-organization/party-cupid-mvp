// A-1 진입 라우터 — 세션 자동 복구 또는 약관으로
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RoomEntryPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createClient();
  const { code } = params;

  // 방 존재 확인
  const { data: room } = await supabase
    .from("rooms")
    .select("id, status")
    .eq("code", code)
    .single();

  if (!room) notFound();

  // 세션 확인
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 이미 이 방의 participant인지 확인
    const { data: participant } = await supabase
      .from("participants")
      .select("id, status")
      .eq("room_id", room.id)
      .eq("anon_user_id", user.id)
      .maybeSingle();

    if (participant?.status === "active") {
      redirect(`/r/${code}/home`);
    }
    if (participant?.status === "kicked") {
      redirect(`/r/${code}/locked`);
    }
    // user 세션은 있지만 participant 미생성 → 닉네임 입력으로 직행 (약관 스킵)
    redirect(`/r/${code}/nickname`);
  }

  // 신규 진입 → 약관으로
  redirect(`/r/${code}/consent`);
}
