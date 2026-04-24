// A-6 참여자 홈 — Minimal 버전 (지금 뭘 해야 하는지만)
// 현재 단계 + 타이머 + 큰 CTA + Bottom Nav
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import StageTimer from "@/components/StageTimer";
import NotificationToast from "@/components/NotificationToast";

export default async function ParticipantHome({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createClient();
  const { code } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/r/${code}/nickname`);

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, status")
    .eq("code", code)
    .single();
  if (!room) redirect("/");

  const { data: participant } = await supabase
    .from("participants")
    .select("id, nickname, entry_number, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .maybeSingle();

  if (!participant) redirect(`/r/${code}/nickname`);
  if (participant.status === "kicked") redirect(`/r/${code}/locked`);
  if (participant.status === "left") redirect(`/r/${code}/nickname`);

  // 활성 stage + stage_run (타이머용)
  const { data: stages } = await supabase
    .from("stages")
    .select('id, "order", name, collect_vote, status, trigger_timer_minutes, current_run_id')
    .eq("room_id", room.id)
    .order("order");
  const activeStage = stages?.find((s) => s.status === "active");
  let activeRunOpenedAt: string | null = null;
  if (activeStage?.current_run_id) {
    const { data: run } = await supabase
      .from("stage_runs")
      .select("opened_at")
      .eq("id", activeStage.current_run_id)
      .single();
    activeRunOpenedAt = run?.opened_at ?? null;
  }

  const isVotingPhase = activeStage?.collect_vote === true;
  const isClosed = room.status === "closed";

  // 상태별 메시지
  let stageLabel: string;
  let stageTitle: string;
  let ctaHref: string;
  let ctaText: string;
  let ctaIcon: string;

  if (isClosed) {
    stageLabel = "파티 종료";
    stageTitle = "🎉 매칭 결과 확인";
    ctaHref = `/r/${code}/matches`;
    ctaText = "매칭 결과 보기";
    ctaIcon = "celebration";
  } else if (activeStage) {
    const idx = stages?.findIndex((s) => s.id === activeStage.id) ?? 0;
    const total = stages?.length ?? 0;
    stageLabel = `단계 ${idx + 1} / ${total}`;
    stageTitle = `${isVotingPhase ? "💜 " : ""}${activeStage.name}`;
    if (isVotingPhase) {
      ctaHref = `/r/${code}/people`;
      ctaText = "❤ 참여자 보러 가기";
      ctaIcon = "favorite";
    } else {
      ctaHref = `/r/${code}/people`;
      ctaText = "참여자 보기";
      ctaIcon = "group";
    }
  } else {
    stageLabel = "시작 대기";
    stageTitle = "⏳ 호스트가 곧 시작합니다";
    ctaHref = `/r/${code}/people`;
    ctaText = "참여자 미리 보기";
    ctaIcon = "group";
  }

  return (
    <div className="bg-bg min-h-screen pb-24 text-slate-900">
      <RealtimeRefresh
        tables={["stages", "matches", "messages"]}
        roomId={room.id}
        debounceMs={800}
      />
      <NotificationToast
        roomId={room.id}
        participantId={participant.id}
        roomCode={code}
      />

      {/* TopAppBar */}
      <header className="bg-bg border-b border-primary-soft flex justify-between items-center w-full px-4 h-14 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-primary text-[22px]">💝</span>
          <h1 className="font-bold text-[18px] tracking-tight text-primary truncate max-w-[240px]">
            {room.name}
          </h1>
        </div>
        <Link
          href={`/r/${code}/me`}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-primary-soft transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center text-white text-[11px] font-bold">
            {participant.nickname.slice(0, 1)}
          </div>
          <span className="text-[11px] text-slate-600 font-medium">
            #{participant.entry_number} {participant.nickname}
          </span>
        </Link>
      </header>

      {/* 단일 포커스 카드: 현재 단계 + 타이머 + 큰 CTA */}
      <main className="flex items-center justify-center min-h-[calc(100vh-14rem)] px-4">
        <section className="w-full max-w-md bg-white rounded-2xl p-8 border border-primary-soft shadow-sm text-center">
          <span className="inline-block text-[12px] font-medium text-slate-400 tracking-wide uppercase mb-3">
            {stageLabel}
          </span>

          <h2 className="text-[28px] font-bold text-accent mb-6 leading-tight">
            {stageTitle}
          </h2>

          {activeRunOpenedAt && activeStage?.trigger_timer_minutes && (
            <div className="mb-6 flex justify-center">
              <StageTimer
                openedAt={activeRunOpenedAt}
                timerMinutes={activeStage.trigger_timer_minutes}
                label="마감"
              />
            </div>
          )}

          <Link
            href={ctaHref}
            className="w-full bg-primary text-white font-bold text-[17px] py-4 rounded-full active:scale-[0.98] transition-transform flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {ctaIcon}
            </span>
            {ctaText}
          </Link>

          <p className="text-[11px] text-slate-400 mt-6">
            {isVotingPhase
              ? "💡 마음에 드는 사람에게 ❤를 보내세요"
              : isClosed
              ? "양방향 ❤ 매칭만 공개됩니다"
              : "단계가 시작되면 자동으로 업데이트됩니다"}
          </p>
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white border-t border-primary-soft shadow-[0_-4px_20px_rgba(255,77,109,0.1)] rounded-t-3xl">
        <button className="active:scale-90 transition-transform duration-150 flex flex-col items-center justify-center bg-primary-soft text-primary rounded-3xl px-4 py-1.5">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[13px] font-medium">Home</span>
        </button>
        <Link href={`/r/${code}/people`} className="active:scale-90 transition-transform duration-150 flex flex-col items-center justify-center text-slate-400 px-4 py-1.5 hover:text-primary">
          <span className="material-symbols-outlined">group</span>
          <span className="text-[13px] font-medium">People</span>
        </Link>
        <Link
          href={`/r/${code}/messages`}
          className="active:scale-90 transition-transform duration-150 flex flex-col items-center justify-center text-slate-400 px-4 py-1.5 hover:text-primary"
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="text-[13px] font-medium">Messages</span>
        </Link>
        <Link
          href={`/r/${code}/matches`}
          className="active:scale-90 transition-transform duration-150 flex flex-col items-center justify-center text-slate-400 px-4 py-1.5 hover:text-primary"
        >
          <span className="material-symbols-outlined">favorite</span>
          <span className="text-[13px] font-medium">Matching</span>
        </Link>
      </nav>
    </div>
  );
}
