// A-6 참여자 홈 — prototype/v3-01-home.html 충실 변환
// 모바일 우선 (max-w-[375px])
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RealtimeRefresh from "@/components/RealtimeRefresh";

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

  // 참여자가 아직 INSERT 안 됨 → 닉네임 페이지로 (consent로 가면 무한 루프)
  if (!participant) redirect(`/r/${code}/nickname`);
  if (participant.status === "kicked") redirect(`/r/${code}/locked`);
  if (participant.status === "left") redirect(`/r/${code}/nickname`);

  const roomName = room.name;
  const nickname = participant.nickname;
  const entryNumber = participant.entry_number;

  // 단계 실데이터
  const { data: stagesRaw } = await supabase
    .from("stages")
    .select('id, "order", name, collect_vote, status')
    .eq("room_id", room.id)
    .order("order");
  const stages = stagesRaw ?? [];
  const activeStageIdx = stages.findIndex((s) => s.status === "active");

  type PhaseStatus = "done" | "active" | "pending" | "future";
  const phases = stages.map((s, i) => {
    let status: PhaseStatus;
    if (s.status === "closed") status = "done";
    else if (s.status === "active") status = "active";
    else if (i === activeStageIdx + 1) status = "pending";
    else status = "future";
    return {
      n: s.order,
      name: `${s.name}${s.collect_vote ? " ❤" : ""}`,
      status,
    };
  });

  const currentPhaseName =
    activeStageIdx >= 0
      ? `${stages[activeStageIdx].collect_vote ? "💜 " : ""}${stages[activeStageIdx].name}`
      : room.status === "closed"
      ? "🎉 파티 종료"
      : "⏳ 시작 대기";

  // 본인 누적 ❤ 보낸 수 (모든 stage_run에서)
  const { count: heartsSent } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("voter_id", participant.id)
    .not("target_id", "is", null);

  // 본인이 받은 ❤ 수 (RLS상 본인 vote만 read 가능 → 받은 ❤는 직접 카운트 불가)
  // 대신 매칭 수만 표시 (양방향 매칭 = 받은 + 보낸 동시 성립)
  const { count: matchCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room.id);

  // 본인 매칭에서 메시지 수
  const { count: messageCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room.id)
    .eq("is_hidden", false);

  // 진행률 계산 (closed / 전체)
  const progressPct =
    stages.length > 0
      ? Math.round((stages.filter((s) => s.status === "closed").length / stages.length) * 100)
      : 0;

  return (
    <div className="bg-bg min-h-screen pb-24 text-slate-900">
      <RealtimeRefresh
        tables={["stages", "matches", "messages"]}
        roomId={room.id}
        debounceMs={800}
      />
      {/* TopAppBar */}
      <header className="bg-bg border-b border-primary-soft flex justify-between items-center w-full px-4 h-14 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-primary text-[22px]">💝</span>
          <h1 className="font-bold text-[22px] tracking-tight text-primary truncate max-w-[240px]">
            {roomName}
          </h1>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          #{entryNumber} {nickname}
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-[375px] mx-auto">
        {/* Current Phase Card */}
        <section className="bg-accent-soft rounded-lg p-5 shadow-sm relative overflow-hidden border border-accent/10">
          <div className="absolute -top-4 -right-4 opacity-10 text-[100px] text-accent select-none">💜</div>
          <div className="relative z-10">
            <span className="text-[13px] font-medium text-slate-500">
              {activeStageIdx >= 0
                ? `단계 ${activeStageIdx + 1}/${stages.length}`
                : room.status === "closed"
                ? "파티 종료됨"
                : `${stages.length}단계 예정 — 호스트 시작 대기`}
            </span>
            <h2 className="text-[22px] font-bold text-accent mt-1 mb-4">{currentPhaseName}</h2>

            <div className="flex gap-2 mb-4">
              <div className="bg-white rounded-lg px-3 py-2 flex-1 shadow-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-medium text-slate-500">진행률</span>
                  <span className="text-[11px] font-bold text-accent">{progressPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/60 rounded-full px-4 py-2 mb-4 backdrop-blur-sm">
              <p className="text-[13px] font-bold text-primary">내 누적 ❤ {heartsSent ?? 0}회</p>
              <span className="text-slate-400 text-[18px]">→</span>
            </div>

            <Link
              href={`/r/${code}/people`}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-full active:scale-95 transition-transform flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
            >
              참여자 보기
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* Phase Timeline */}
        <section className="bg-white rounded-lg p-5 border border-primary-soft shadow-sm">
          <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">list_alt</span>
            진행 상황
          </h3>
          <div className="space-y-4">
            {phases.map((p) => (
              <div key={p.n} className={`flex gap-3 items-start ${p.status === "done" ? "opacity-50" : ""} ${p.status === "active" ? "relative" : ""}`}>
                {p.status === "active" && (
                  <div className="absolute left-[9px] top-[24px] w-[2px] h-[24px] bg-slate-100"></div>
                )}
                <div className="mt-1">
                  {p.status === "done" && (
                    <span className="material-symbols-outlined text-success text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                  {p.status === "active" && (
                    <span className="material-symbols-outlined text-accent text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
                  )}
                  {p.status === "pending" && (
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">hourglass_empty</span>
                  )}
                  {p.status === "future" && (
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">flag</span>
                  )}
                </div>
                <div
                  className={`text-[13px] leading-tight ${
                    p.status === "active"
                      ? "font-bold text-accent"
                      : p.status === "done"
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  {p.n}. {p.name}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity Stats — 실데이터 */}
        <section className="grid grid-cols-3 gap-3">
          <Link
            href={`/r/${code}/my-hearts`}
            className="bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-primary-soft hover:bg-primary-soft/30 transition-colors"
          >
            <span className="text-primary text-[18px] mb-1">❤</span>
            <span className="text-[18px] font-bold">{heartsSent ?? 0}</span>
            <span className="text-[11px] text-slate-400">내 선택</span>
          </Link>
          <Link
            href={`/r/${code}/messages`}
            className="bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-primary-soft hover:bg-primary-soft/30 transition-colors"
          >
            <span className="text-accent text-[18px] mb-1">💌</span>
            <span className="text-[18px] font-bold">{messageCount ?? 0}</span>
            <span className="text-[11px] text-slate-400">쪽지</span>
          </Link>
          <Link
            href={`/r/${code}/matches`}
            className="bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-primary-soft hover:bg-primary-soft/30 transition-colors"
          >
            <span className="text-warning text-[18px] mb-1">🎉</span>
            <span className="text-[18px] font-bold">{matchCount ?? 0}</span>
            <span className="text-[11px] text-slate-400">매칭</span>
          </Link>
        </section>

        {/* Received Interest — 매칭 종료 전 잠금 */}
        <section className="bg-white rounded-lg p-5 border border-primary-soft shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <span className="material-symbols-outlined text-slate-300">
              {room.status === "closed" ? "lock_open" : "lock"}
            </span>
          </div>
          <h3 className="text-[15px] font-bold mb-4 flex items-center gap-1">
            {room.status === "closed" ? "🎉 매칭 결과" : "🔒 매칭은 종료 후 공개"}
          </h3>
          <Link
            href={`/r/${code}/matches`}
            className="flex items-center gap-4 bg-primary-soft rounded-lg p-4 hover:bg-primary-soft/70 transition-colors"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[24px] shadow-sm">
              💝
            </div>
            <div>
              <p className="text-[15px] font-bold text-primary">
                {room.status === "closed"
                  ? `${matchCount ?? 0}쌍 매칭 결과 보기 →`
                  : "파티 종료 시 자동 공개"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">🔒 익명 · 양방향만 공개</p>
            </div>
          </Link>
        </section>

        {/* Visual Asset (외부 이미지) — v3-01-home.html과 동일 */}
        <div className="rounded-lg overflow-hidden h-32 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Party"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGS7aVITKS0enKZo3Qu_PkaZyX4JKYty85zoxnA40CKSSxLxIM1FuW0xx34u6glmASWNhpPrVlmuF4H2jSlHxamMZXVlqB8U2T1tjC4fXQJpHzG5VKuNdOtN780HIw_DEEcjiW5Gj1svOWh29u3Hu6fxUsCrndzB8j_b_9chTfJnUhMI2INAuPoSHzP3EwCoqFwQKpre2K51I6knY2zTx46kxS_wNL67cNxzFZu2hKqO6siRIY_ASVaRF0LRROXtxG10RKSQ0Oi4o"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
            <p className="text-white text-[13px] font-medium">
              {nickname} (#{entryNumber}) · 따뜻한 인연이 만들어지는 중입니다
            </p>
          </div>
        </div>
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
