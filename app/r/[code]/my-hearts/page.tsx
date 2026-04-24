// A-9 내 선택 검토 — prototype/04-my-hearts.html 충실 변환
// 본인이 ❤한 사람을 단계별로 그룹핑 (유지/신규/해제 예정)
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleHeart } from "../actions";
import RealtimeRefresh from "@/components/RealtimeRefresh";

const AVATAR_GRADIENTS = [
  "from-rose-200 to-pink-300",
  "from-blue-200 to-cyan-300",
  "from-orange-200 to-amber-300",
  "from-purple-200 to-violet-300",
  "from-emerald-200 to-teal-300",
  "from-pink-200 to-rose-300",
];

export default async function MyHeartsPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createClient();
  const { code } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/r/${code}/consent`);

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, status")
    .eq("code", code)
    .single();
  if (!room) notFound();

  const { data: me } = await supabase
    .from("participants")
    .select("id, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .single();
  if (!me || me.status !== "active") redirect(`/r/${code}/consent`);

  // 모든 collect_vote=true 단계 (순서대로)
  const { data: voteStagesRaw } = await supabase
    .from("stages")
    .select('id, "order", name, status, current_run_id, max_selections')
    .eq("room_id", room.id)
    .eq("collect_vote", true)
    .order("order");
  const voteStages = voteStagesRaw ?? [];

  const activeStage = voteStages.find((s) => s.status === "active");
  const previousStages = voteStages.filter(
    (s) => s.status === "closed" && (!activeStage || s.order < activeStage.order),
  );

  // 본인의 모든 vote (단계 무관, target_id NOT NULL)
  const allRunIds = voteStages
    .map((s) => s.current_run_id)
    .filter((x): x is string => !!x);

  let myVotesByStageRun = new Map<string, Set<string>>();
  if (allRunIds.length > 0) {
    const { data: myVotes } = await supabase
      .from("votes")
      .select("stage_run_id, target_id, is_locked")
      .eq("voter_id", me.id)
      .in("stage_run_id", allRunIds)
      .not("target_id", "is", null);
    for (const v of myVotes ?? []) {
      if (!v.target_id) continue;
      if (!myVotesByStageRun.has(v.stage_run_id)) {
        myVotesByStageRun.set(v.stage_run_id, new Set());
      }
      myVotesByStageRun.get(v.stage_run_id)!.add(v.target_id);
    }
  }

  // 현재 활성 stage_run 기준 본인 ❤
  const currentRunId = activeStage?.current_run_id ?? null;
  const currentHearted = currentRunId
    ? myVotesByStageRun.get(currentRunId) ?? new Set<string>()
    : new Set<string>();

  // 이전 stage_run에서 ❤ 했던 사람 (가장 마지막 closed stage 기준)
  const prevRunId = previousStages.length > 0
    ? previousStages[previousStages.length - 1].current_run_id
    : null;
  const prevHearted = prevRunId
    ? myVotesByStageRun.get(prevRunId) ?? new Set<string>()
    : new Set<string>();

  // 분류
  const keptIds = [...currentHearted].filter((id) => prevHearted.has(id));
  const newIds = [...currentHearted].filter((id) => !prevHearted.has(id));
  // "해제 예정" = 이전엔 ❤했으나 이번엔 아직 안 함 (스펙상 의미 모호 → 단순화: 0건)
  const droppedIds = [...prevHearted].filter((id) => !currentHearted.has(id));

  // participant 상세 정보
  const allTargetIds = Array.from(
    new Set([...currentHearted, ...prevHearted]),
  );
  const partsMap = new Map<string, { id: string; nickname: string; entry_number: number }>();
  if (allTargetIds.length > 0) {
    const { data: parts } = await supabase
      .from("participants")
      .select("id, nickname, entry_number")
      .in("id", allTargetIds);
    for (const p of parts ?? []) partsMap.set(p.id, p);
  }

  const totalCount = currentHearted.size;
  const maxSel = activeStage?.max_selections ?? 3;
  const isVotingPhase = !!activeStage && !!currentRunId;

  function PersonCard({
    pid,
    badge,
    badgeColor,
    bgColor,
    borderColor,
  }: {
    pid: string;
    badge: string;
    badgeColor: string;
    bgColor: string;
    borderColor: string;
  }) {
    const p = partsMap.get(pid);
    if (!p) return null;
    const gradient = AVATAR_GRADIENTS[(p.entry_number ?? 0) % AVATAR_GRADIENTS.length];
    return (
      <div
        className={`${bgColor} rounded-xl p-4 border-l-4 ${borderColor} flex items-center justify-between`}
      >
        <Link
          href={`/r/${code}/people/${pid}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-xl`}
            >
              {p.nickname.slice(0, 1)}
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span
              className={`${badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit`}
            >
              {badge}
            </span>
            <span className="font-bold text-slate-800 truncate">
              #{p.entry_number} {p.nickname}
            </span>
          </div>
        </Link>
        {isVotingPhase && (
          <form
            action={async () => {
              "use server";
              await toggleHeart(code, pid);
            }}
          >
            <button
              type="submit"
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm hover:scale-105 active:scale-90 transition-all"
              title="❤ 취소"
            >
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bg font-body text-slate-900 min-h-screen pb-32">
      <RealtimeRefresh tables={["votes", "stages"]} roomId={room.id} debounceMs={500} />

      {/* TopAppBar */}
      <header className="sticky top-0 z-40 bg-bg border-b border-rose-100 flex items-center w-full px-4 h-20">
        <div className="flex items-center w-full gap-3">
          <Link
            href={`/r/${code}/home`}
            className="p-2 -ml-2 hover:bg-rose-50 rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-bold text-[18px] tracking-tight text-primary">내 선택 검토</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-accent text-[11px] font-bold">
                {isVotingPhase
                  ? `💜 ${activeStage!.name} · ❤ ${totalCount}/${maxSel}`
                  : room.status === "closed"
                  ? "🎉 파티 종료"
                  : "⏳ 투표 단계 대기"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-md mx-auto space-y-6">
        {/* Filter Tier 1 */}
        <div className="flex gap-2">
          <div className="flex-1 py-3 px-4 bg-primary text-white rounded-full font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-200">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            확정 {totalCount}
          </div>
          {droppedIds.length > 0 && (
            <div className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-500 rounded-full font-bold text-sm flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
              해제 {droppedIds.length}
            </div>
          )}
        </div>

        {/* Filter Tier 2 — 카운트 표시 (탭 동작은 서버 페이지라 실제 필터링은 미구현, 시각적 정보) */}
        <div className="overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-6 border-b border-rose-100 min-w-max">
            <span className="pb-3 px-1 text-primary font-bold text-[15px] border-b-2 border-primary">
              모두 {totalCount}
            </span>
            <span className="pb-3 px-1 text-slate-400 font-medium text-[15px]">유지 {keptIds.length}</span>
            <span className="pb-3 px-1 text-slate-400 font-medium text-[15px]">신규 {newIds.length}</span>
            <span className="pb-3 px-1 text-slate-400 font-medium text-[15px]">해제 예정 {droppedIds.length}</span>
          </div>
        </div>

        {totalCount === 0 && droppedIds.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-primary-soft">
            <span className="material-symbols-outlined text-slate-300 text-[48px] mb-2">
              favorite_border
            </span>
            <p className="text-slate-500 text-[15px] font-medium mb-1">
              아직 ❤ 보낸 사람이 없습니다
            </p>
            <p className="text-slate-400 text-[13px]">
              참여자 목록에서 마음에 드는 사람에게 ❤를 보내보세요
            </p>
          </div>
        ) : (
          <>
            {/* 유지 */}
            {keptIds.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-bold text-lg flex items-center gap-1 text-slate-800">
                  <span className="material-symbols-outlined text-rose-400">check</span>
                  유지 ({keptIds.length})
                </h2>
                {keptIds.map((pid) => (
                  <PersonCard
                    key={pid}
                    pid={pid}
                    badge="✓ 이전 → 현재 유지"
                    badgeColor="bg-primary"
                    bgColor="bg-primary-soft"
                    borderColor="border-primary"
                  />
                ))}
              </section>
            )}

            {/* 신규 */}
            {newIds.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-bold text-lg flex items-center gap-1 text-slate-800">
                  <span className="material-symbols-outlined text-emerald-500">auto_awesome</span>
                  신규 ({newIds.length})
                </h2>
                {newIds.map((pid) => (
                  <PersonCard
                    key={pid}
                    pid={pid}
                    badge="✨ 이번 단계 신규"
                    badgeColor="bg-success"
                    bgColor="bg-success-soft"
                    borderColor="border-success"
                  />
                ))}
              </section>
            )}

            {/* 해제 예정 (이전 ❤이지만 현재 미선택) */}
            {droppedIds.length > 0 && (
              <section className="space-y-3 pb-4">
                <h2 className="font-bold text-lg flex items-center gap-1 text-slate-400">
                  <span className="material-symbols-outlined">delete</span>
                  해제됨 ({droppedIds.length})
                </h2>
                {droppedIds.map((pid) => {
                  const p = partsMap.get(pid);
                  if (!p) return null;
                  const gradient = AVATAR_GRADIENTS[(p.entry_number ?? 0) % AVATAR_GRADIENTS.length];
                  return (
                    <div
                      key={pid}
                      className="bg-slate-50 rounded-xl p-4 border-l-4 border-slate-300 flex items-center justify-between opacity-70"
                    >
                      <Link
                        href={`/r/${code}/people/${pid}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 grayscale">
                          <div
                            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-xl`}
                          >
                            {p.nickname.slice(0, 1)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="bg-slate-300 text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                            이전엔 ❤
                          </span>
                          <span className="font-medium text-slate-500 truncate line-through">
                            #{p.entry_number} {p.nickname}
                          </span>
                        </div>
                      </Link>
                      {isVotingPhase && (
                        <form
                          action={async () => {
                            "use server";
                            await toggleHeart(code, pid);
                          }}
                        >
                          <button
                            type="submit"
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:text-primary hover:scale-105 active:scale-90 transition-all"
                            title="다시 ❤"
                          >
                            <span className="material-symbols-outlined text-[28px]">
                              favorite
                            </span>
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}

        {/* Info Box */}
        <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
          <p className="text-slate-500 text-[13px] leading-relaxed flex gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
            <span>
              💡 {isVotingPhase
                ? "현재 단계 마감 시점의 선택이 매칭 후보에 포함됩니다"
                : "투표 단계에서 ❤ 한 사람을 단계별로 비교할 수 있습니다"}
            </span>
          </p>
        </div>

        {/* Footer CTA */}
        <Link
          href={`/r/${code}/people`}
          className="w-full py-4 bg-white border-2 border-primary-soft text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors mb-4 active:scale-95"
        >
          <span className="material-symbols-outlined">groups</span>
          참여자 더 보기
        </Link>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-white border-t border-rose-50 shadow-[0_-4px_12px_rgba(255,77,109,0.08)] rounded-t-[24px]">
        <Link
          href={`/r/${code}/home`}
          className="flex flex-col items-center justify-center text-slate-400 px-3 py-1.5 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[11px] font-medium mt-1">홈</span>
        </Link>
        <Link
          href={`/r/${code}/people`}
          className="flex flex-col items-center justify-center text-slate-400 px-3 py-1.5 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined">groups</span>
          <span className="text-[11px] font-medium mt-1">참여자</span>
        </Link>
        <button className="flex flex-col items-center justify-center bg-primary-soft text-primary rounded-2xl px-3 py-1.5 active:scale-90 duration-200">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <span className="text-[11px] font-medium mt-1 text-primary">내 선택</span>
        </button>
        <Link
          href={`/r/${code}/matches`}
          className="flex flex-col items-center justify-center text-slate-400 px-3 py-1.5 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined">military_tech</span>
          <span className="text-[11px] font-medium mt-1">매칭</span>
        </Link>
      </nav>
    </div>
  );
}
