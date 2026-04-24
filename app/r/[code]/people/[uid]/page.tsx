// A-8 참여자 상세 — 실데이터 fetch + ❤ 토글 Server Action
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleHeart, reportTarget } from "../../actions";
import ReportButton from "@/components/ReportButton";

export default async function PersonDetailPage({
  params,
}: {
  params: { code: string; uid: string };
}) {
  const supabase = createClient();
  const { code, uid } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/r/${code}/consent`);

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status")
    .eq("code", code)
    .single();
  if (!room) notFound();

  // 본인
  const { data: me } = await supabase
    .from("participants")
    .select("id, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .single();
  if (!me || me.status !== "active") redirect(`/r/${code}/consent`);

  if (me.id === uid) redirect(`/r/${code}/people`); // 자기 자신 상세 차단

  // 대상 참여자
  const { data: person } = await supabase
    .from("participants")
    .select("id, nickname, entry_number, joined_at, status")
    .eq("id", uid)
    .eq("room_id", room.id)
    .single();
  if (!person) notFound();

  // 활성 투표 단계
  const { data: activeStages } = await supabase
    .from("stages")
    .select('id, name, collect_vote, max_selections, status, current_run_id')
    .eq("room_id", room.id)
    .eq("status", "active")
    .limit(1);
  const activeStage = activeStages?.[0];
  const isVotingPhase = activeStage?.collect_vote === true && !!activeStage?.current_run_id;

  let hearted = false;
  if (isVotingPhase && activeStage?.current_run_id) {
    const { data: existing } = await supabase
      .from("votes")
      .select("id")
      .eq("stage_run_id", activeStage.current_run_id)
      .eq("voter_id", me.id)
      .eq("target_id", uid)
      .maybeSingle();
    hearted = !!existing;
  }

  // 본인이 ❤한 모든 단계 목록 (투표 상태 표시)
  const { data: voteHistory } = await supabase
    .from("votes")
    .select("stage_run_id")
    .eq("voter_id", me.id)
    .eq("target_id", uid);
  const heartedStageRunIds = new Set((voteHistory ?? []).map((v) => v.stage_run_id));

  // 단계 목록 (투표 단계만)
  const { data: voteStagesRaw } = await supabase
    .from("stages")
    .select('id, "order", name, current_run_id')
    .eq("room_id", room.id)
    .eq("collect_vote", true)
    .order("order");
  const voteStages = voteStagesRaw ?? [];

  const elapsed = Math.floor(
    (Date.now() - new Date(person.joined_at).getTime()) / 60000,
  );
  const enteredAt = elapsed < 1 ? "방금 입장" : `${elapsed}분 전 입장`;

  return (
    <div className="bg-bg min-h-screen text-slate-900">
      {/* TopAppBar */}
      <header className="bg-bg flex justify-between items-center w-full px-4 h-16 fixed top-0 z-50">
        <Link
          href={`/r/${code}/people`}
          className="w-10 h-10 flex items-center justify-center hover:bg-primary-soft rounded-full active:opacity-70 transition-all"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <h1 className="font-bold text-[18px] text-slate-900">
          {person.nickname} #{person.entry_number}
        </h1>
        <div className="w-10 h-10" />
      </header>

      <main className="pt-20 pb-24 px-5 max-w-md mx-auto">
        {/* Profile Section */}
        <section className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className="w-[120px] h-[120px] rounded-full border-4 border-primary-soft overflow-hidden bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-4xl font-black text-white">
              {person.nickname.slice(0, 1)}
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-success rounded-full border-2 border-white"></div>
          </div>
          <h2 className="text-[22px] font-bold text-slate-900 mb-1">
            {person.nickname} #{person.entry_number}
          </h2>
          <p className="text-[13px] text-slate-500 mb-3">{enteredAt}</p>
          {hearted && (
            <div className="inline-flex items-center px-4 py-1.5 bg-primary-soft text-primary rounded-full text-[13px] font-semibold">
              <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
              ❤ 선택됨
            </div>
          )}
        </section>

        <hr className="border-slate-200/60 mb-8" />

        {/* Action Section */}
        <section className="space-y-6">
          <div>
            <h3 className="text-[13px] font-bold text-slate-400 mb-3 ml-1">이 사람에게...</h3>
            {isVotingPhase ? (
              <form
                action={async () => {
                  "use server";
                  await toggleHeart(code, uid);
                }}
              >
                <button
                  type="submit"
                  className={`w-full border-2 rounded-xl p-6 flex flex-col items-center text-center active:scale-[0.98] transition-transform ${
                    hearted ? "bg-primary-soft border-primary" : "bg-white border-primary-soft"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-primary text-[48px] mb-2"
                    style={hearted ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    favorite
                  </span>
                  <span className="text-primary font-bold text-[18px]">
                    {hearted ? "❤ 보냄 (탭하여 취소)" : "❤ 보내기"}
                  </span>
                  <span className="text-slate-400 text-[11px] mt-2">
                    현재 단계: {activeStage!.name} (최대 {activeStage!.max_selections}명)
                  </span>
                </button>
              </form>
            ) : (
              <div className="w-full border-2 border-slate-200 rounded-xl p-6 flex flex-col items-center text-center bg-slate-50">
                <span className="material-symbols-outlined text-slate-300 text-[48px] mb-2">
                  pause_circle
                </span>
                <span className="text-slate-500 font-medium text-[15px]">
                  현재 ❤ 단계가 아닙니다
                </span>
              </div>
            )}
          </div>
        </section>

        <hr className="border-slate-200/60 my-8" />

        {/* Status Section — 투표 단계별 상태 */}
        {voteStages.length > 0 && (
          <section>
            <h3 className="text-[13px] font-bold text-slate-400 mb-4 ml-1">투표 상태</h3>
            <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
              {voteStages.map((s, i) => {
                const isHearted = !!s.current_run_id && heartedStageRunIds.has(s.current_run_id);
                return (
                  <div key={s.id} className="flex justify-between items-center">
                    <span className="text-[15px]">
                      {i + 1}. {s.name}
                    </span>
                    <span
                      className={`font-bold text-[13px] ${
                        isHearted ? "text-success" : "text-slate-300"
                      }`}
                    >
                      {isHearted ? "✓ 선택" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer — 신고 */}
        <footer className="mt-12 mb-8 flex flex-col items-center gap-4">
          <ReportButton
            variant="text"
            action={async (reason) => {
              "use server";
              return await reportTarget(code, { targetParticipantId: uid, reason });
            }}
          />
          <div className="flex items-center gap-1 text-slate-300">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span className="text-[11px]">익명 보호 — 매칭 시까지 상호 미공개</span>
          </div>
        </footer>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white/80 backdrop-blur-md rounded-t-[24px] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-slate-100">
        <Link
          href={`/r/${code}/home`}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-primary transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[11px] font-medium mt-1">홈</span>
        </Link>
        <Link
          href={`/r/${code}/people`}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-primary transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined">group</span>
          <span className="text-[11px] font-medium mt-1">참여자</span>
        </Link>
        <Link
          href={`/r/${code}/matches`}
          className="flex flex-col items-center justify-center text-primary font-bold active:scale-95 transition-transform"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <span className="text-[11px] font-medium mt-1">매칭</span>
        </Link>
      </nav>
    </div>
  );
}
