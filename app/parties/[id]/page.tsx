// H-3 라이브 운영 (Room Detail) — prototype/v3-05-host-room.html 충실 변환
// 실제 Supabase 데이터 fetch + RLS 자동 적용 (host_id = auth.uid()만 read 가능)
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { advanceStage, forceCloseRoom, kickParticipant } from "./actions";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import QrActions from "@/components/QrActions";

export default async function RoomDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 방 + 단계 + 참여자 수 fetch (RLS로 host_id 매칭 자동 강제)
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, name, status, max_participants, host_id, created_at")
    .eq("id", params.id)
    .single();

  if (!room) notFound();
  if (room.host_id !== user.id) redirect("/dashboard"); // 방어 (RLS도 차단하지만 명시)

  const [profileRes, participantsRes, stagesRes, matchesRes, reportsRes] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("participants")
      .select("id, nickname, entry_number, status, joined_at")
      .eq("room_id", room.id)
      .order("entry_number"),
    supabase
      .from("stages")
      .select('id, "order", name, collect_vote, status, current_run_id')
      .eq("room_id", room.id)
      .order("order"),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("status", "pending"),
  ]);
  const pendingReports = reportsRes.count ?? 0;
  const organizerName = profileRes.data?.display_name ?? user.email?.split("@")[0] ?? "Organizer";
  const organizerInitial = organizerName.slice(0, 1).toUpperCase();
  const participants = participantsRes.data ?? [];
  const stages = stagesRes.data ?? [];
  const matchCount = matchesRes.count ?? 0;
  const activeParticipants = participants.filter((p) => p.status === "active");
  const participantCount = activeParticipants.length;

  const totalStages = stages.length;
  const activeStageIndex = stages.findIndex((s) => s.status === "active");
  const currentStage = activeStageIndex >= 0 ? stages[activeStageIndex] : null;
  const nextStage = activeStageIndex >= 0 ? stages[activeStageIndex + 1] : stages[0];

  // 활성 stage_run의 투표 통계 (실데이터)
  let stageVoterCount = 0;
  let stageTotalVotes = 0;
  if (currentStage?.current_run_id && currentStage.collect_vote) {
    const { data: runVotes } = await supabase
      .from("votes")
      .select("voter_id")
      .eq("stage_run_id", currentStage.current_run_id)
      .not("target_id", "is", null);
    const voters = new Set((runVotes ?? []).map((v) => v.voter_id));
    stageVoterCount = voters.size;
    stageTotalVotes = runVotes?.length ?? 0;
  }
  const completionPct =
    participantCount > 0 ? Math.round((stageVoterCount / participantCount) * 100) : 0;

  // Server Action 바인딩 (closure로 roomId 고정)
  const advanceAction = async () => {
    "use server";
    await advanceStage(room.id);
  };
  const closeAction = async () => {
    "use server";
    await forceCloseRoom(room.id);
  };
  const kickAction = async (formData: FormData) => {
    "use server";
    const pid = String(formData.get("participant_id") ?? "");
    if (pid) await kickParticipant(room.id, pid);
  };

  // 동적 base URL 감지 (로컬/Vercel/커스텀 도메인 모두 자동)
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const protocol = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`;
  const roomUrl = `${baseUrl}/r/${room.code}`;

  const qrDataUrl = await QRCode.toDataURL(roomUrl, {
    width: 400,
    margin: 1,
    color: { dark: "#1F2937", light: "#FFFFFF" },
  });
  return (
    <div className="bg-bg min-h-screen text-slate-900">
      <RealtimeRefresh
        tables={["participants", "stages", "votes", "matches"]}
        roomId={room.id}
      />
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-16 flex justify-between items-center px-6 bg-white z-[60] border-b border-rose-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center text-slate-600 hover:text-rose-500 transition-colors gap-1 text-sm font-medium">
            <span className="material-symbols-outlined">arrow_back</span>
            대시보드
          </Link>
          <div className="h-4 w-px bg-rose-100 mx-2"></div>
          <span className="text-2xl font-bold text-rose-500 tracking-tight">Party Cupid</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">{organizerName}</p>
              <p className="text-[11px] text-slate-400">Host</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center ring-2 ring-rose-50 transition-all text-rose-500 font-bold">
              {organizerInitial}
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col pt-20 pb-6 px-4 z-50 bg-rose-50 border-r border-rose-100">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-rose-500">qr_code_2</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Room {room.code}</h3>
              <p className="text-[11px] text-slate-500">
                {currentStage ? `Phase: ${currentStage.name} 진행 중` : "단계 미시작"}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 bg-white text-rose-600 font-bold border-r-4 border-rose-500 rounded-l-lg shadow-sm">
            <span className="material-symbols-outlined">dashboard_customize</span>
            <span className="text-sm">Live Control</span>
          </div>
          <Link
            href={`/parties/${room.id}/stages`}
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-rose-100/50 hover:translate-x-1 duration-200"
          >
            <span className="material-symbols-outlined">list_alt</span>
            <span className="text-sm">Stages</span>
          </Link>
          <Link
            href={`/parties/${room.id}/reports`}
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-rose-100/50 hover:translate-x-1 duration-200"
          >
            <span className="material-symbols-outlined">report_problem</span>
            <span className="text-sm">Reports</span>
          </Link>
          <Link
            href={`/parties/${room.id}/matches`}
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-rose-100/50 hover:translate-x-1 duration-200"
          >
            <span className="material-symbols-outlined">favorite</span>
            <span className="text-sm">Match Results</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-rose-100/50 hover:translate-x-1 duration-200 mt-6 border-t border-rose-100/60"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm">대시보드로</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 pt-24 pb-12 px-8 max-w-[1280px]">
        {/* Sub Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{room.name}</h1>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded flex items-center gap-1 uppercase ${
                room.status === "live" ? "bg-success-soft text-success" :
                room.status === "closed" ? "bg-slate-100 text-slate-500" :
                "bg-primary-soft text-primary"
              }`}>
                {room.status === "live" && <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>}
                {room.status === "live" ? "LIVE" : room.status === "closed" ? "종료" : "준비"}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Created at {new Date(room.created_at).toLocaleDateString("ko-KR")} · 코드: <strong>{room.code}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/parties/${room.id}/stages`}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              단계 편집
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column (40%) */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* QR Card */}
            <div className="bg-white p-8 rounded-lg border border-rose-100 shadow-sm flex flex-col items-center">
              <div className="mb-6 p-4 bg-rose-50 rounded-xl">
                <div className="w-[240px] h-[240px] bg-white rounded-lg flex items-center justify-center border-2 border-rose-100 relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt={`QR for ${roomUrl}`} className="w-[200px] h-[200px]" />
                  <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <span className="material-symbols-outlined text-rose-500 text-4xl">zoom_in</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs mb-2 font-medium tracking-wider">ROOM URL</p>
              <div className="bg-rose-50 px-4 py-2 rounded-full text-rose-600 font-bold text-lg mb-6 tracking-tight break-all">
                {roomUrl.replace(/^https?:\/\//, "")}
              </div>
              <QrActions roomUrl={roomUrl} qrDataUrl={qrDataUrl} roomCode={room.code} />
            </div>

            {/* Operational Tools */}
            <div className="bg-warning-surface p-6 rounded-lg border border-warning/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">진행 단계 커스텀</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">진행 중인 파티의 다음 단계를 미리 수정하거나 건너뛸 수 있습니다.</p>
                </div>
                <Link
                  href={`/parties/${room.id}/stages`}
                  className="whitespace-nowrap px-4 py-2 bg-white text-warning font-bold text-sm rounded-lg border border-warning/30 hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
                  단계 구성 편집
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column (60%) */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Live Status Card */}
            <div className="bg-white p-6 rounded-lg border border-rose-100 shadow-sm">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-slate-400">PARTICIPANTS</span>
                      <span className="text-sm font-bold text-rose-500">{participantCount ?? 0} / {room.max_participants}</span>
                    </div>
                    <div className="w-full h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, ((participantCount ?? 0) / room.max_participants) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-slate-400">PHASE PROGRESS</span>
                      <span className="text-sm font-bold text-accent">
                        단계 {activeStageIndex >= 0 ? activeStageIndex + 1 : 0} / {totalStages}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: totalStages }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i < activeStageIndex ? "bg-accent" :
                            i === activeStageIndex ? "bg-accent shadow-[0_0_8px_rgba(124,58,237,0.4)]" :
                            "bg-slate-100"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-accent-soft p-4 rounded-xl flex flex-col justify-center border border-accent/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <span className="text-accent font-extrabold text-lg">
                      {currentStage?.name ?? "단계 미시작"}
                    </span>
                  </div>
                  <p className="text-accent/70 text-xs font-medium">실시간 호감도 셔플 중</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-rose-500 mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                  <p className="text-xl font-black text-slate-800">
                    {currentStage ? "수동" : "—"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Trigger</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-center text-center relative overflow-hidden">
                  <span className="material-symbols-outlined text-success mb-1">fact_check</span>
                  <p className="text-xl font-black text-slate-800">
                    {currentStage?.collect_vote
                      ? `${stageVoterCount} / ${participantCount}`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {currentStage?.collect_vote ? "투표완료" : "비투표 단계"}
                  </p>
                  {currentStage?.collect_vote && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-success transition-all"
                      style={{ width: `${completionPct}%` }}
                    ></div>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-rose-500 mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-black text-slate-800">{stageTotalVotes}</p>
                    <p className="text-[10px] text-success font-bold">❤</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    매칭 {matchCount}쌍
                  </p>
                </div>
              </div>
            </div>

            {/* Phase Control Card */}
            <div className="bg-white p-8 rounded-lg border-2 border-rose-200 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded text-[10px] font-bold text-rose-500">
                  <span className="material-symbols-outlined text-[12px]">info</span>
                  AUTO-TRANSITION OFF
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-1">
                  <span className="material-symbols-outlined text-[18px]">fast_forward</span>
                  {room.status === "closed"
                    ? "파티가 종료되었습니다"
                    : nextStage
                    ? `다음 단계: ${nextStage.name}`
                    : currentStage
                    ? "마지막 단계 진행 중 — 다음 클릭 시 종료 + 매칭 판정"
                    : "첫 단계 시작 대기"}
                </div>
                <p className="text-xs text-slate-400">활성 참여자 {participantCount}명</p>
              </div>
              <form action={advanceAction} className="flex gap-4">
                <button
                  type="submit"
                  disabled={room.status === "closed"}
                  className="flex-[3] py-4 bg-primary text-white font-extrabold text-lg rounded-xl shadow-md shadow-rose-200 hover:bg-rose-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStage
                    ? nextStage
                      ? "다음 단계로"
                      : "파티 종료 + 매칭 판정"
                    : "첫 단계 시작"}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            </div>

            {/* Risk Action */}
            <div className="bg-slate-100 p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-danger text-2xl">warning</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">위험 액션 (2단계 확인)</h4>
                    <p className="text-xs text-slate-500">이 작업은 취소할 수 없으며 파티가 즉시 종료됩니다.</p>
                  </div>
                </div>
                <form action={closeAction}>
                  <button
                    type="submit"
                    disabled={room.status === "closed"}
                    className="whitespace-nowrap px-6 py-2.5 bg-danger text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    파티 강제 종료
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tabs */}
        <div className="mt-8 border-t border-rose-100 pt-8">
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-rose-100 w-max mx-auto shadow-sm">
            <div className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white font-bold rounded-lg">
              <span className="material-symbols-outlined text-[18px]">group</span>
              참여자 <span className="opacity-80">{participantCount}</span>
            </div>
            <Link
              href={`/parties/${room.id}/reports`}
              className="flex items-center gap-2 px-6 py-2.5 text-slate-500 font-bold rounded-lg hover:bg-rose-50 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">report</span>
              신고
              {pendingReports > 0 && (
                <span className="px-1.5 py-0.5 bg-danger text-white text-[10px] rounded-full">
                  {pendingReports}
                </span>
              )}
            </Link>
            <Link
              href={`/parties/${room.id}/matches`}
              className="flex items-center gap-2 px-6 py-2.5 text-slate-500 font-bold rounded-lg hover:bg-rose-50 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">military_tech</span>
              매칭 결과 <span className="opacity-80">{matchCount}</span>
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {participants.length === 0 ? (
              <div className="col-span-full bg-white p-6 rounded-lg border border-rose-50 text-center text-slate-400 text-sm">
                아직 참여자가 없습니다 — QR을 스캔하면 입장합니다
              </div>
            ) : (
              participants.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white p-4 rounded-lg border flex items-center gap-3 ${
                    p.status === "active" ? "border-rose-50" : "border-slate-200 opacity-60"
                  }`}
                >
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center font-bold text-rose-500">
                    {p.nickname.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      #{p.entry_number} {p.nickname}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {p.status === "active"
                        ? new Date(p.joined_at).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : p.status === "kicked"
                        ? "강퇴됨"
                        : "퇴장"}
                    </p>
                  </div>
                  {p.status === "active" && room.status !== "closed" && (
                    <form action={kickAction}>
                      <input type="hidden" name="participant_id" value={p.id} />
                      <button
                        type="submit"
                        className="text-[11px] text-danger hover:underline font-medium"
                        title="강퇴"
                      >
                        강퇴
                      </button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
