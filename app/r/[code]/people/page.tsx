// A-7 참여자 목록 — Supabase 실데이터 fetch + ❤ 투표 Server Action
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleHeart } from "../actions";
import RealtimeRefresh from "@/components/RealtimeRefresh";

// 실시간 참여자 입장 즉시 반영 — Vercel CDN 캐시 우회
export const dynamic = "force-dynamic";
export const revalidate = 0;

const AVATAR_COLORS = [
  "bg-rose-200",
  "bg-blue-200",
  "bg-orange-200",
  "bg-purple-200",
  "bg-emerald-200",
  "bg-amber-200",
  "bg-pink-200",
  "bg-cyan-200",
];

export default async function PeopleListPage({
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

  // 본인 participant
  const { data: me } = await supabase
    .from("participants")
    .select("id, nickname, entry_number, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .single();
  if (!me || me.status !== "active") redirect(`/r/${code}/consent`);

  // 같은 방 참여자 (RLS: 같은 방만 read 가능)
  const { data: peopleRaw } = await supabase
    .from("participants")
    .select("id, nickname, entry_number, joined_at, status")
    .eq("room_id", room.id)
    .eq("status", "active")
    .order("entry_number");
  const people = (peopleRaw ?? []).filter((p) => p.id !== me.id);

  // 현재 활성 투표 단계
  const { data: activeStages } = await supabase
    .from("stages")
    .select('id, "order", name, collect_vote, max_selections, status, current_run_id')
    .eq("room_id", room.id)
    .eq("status", "active")
    .limit(1);
  const activeStage = activeStages?.[0];
  const isVotingPhase = activeStage?.collect_vote === true && !!activeStage?.current_run_id;

  // 본인이 현재 stage_run에 한 ❤ 목록
  let myHeartedIds = new Set<string>();
  if (isVotingPhase && activeStage?.current_run_id) {
    const { data: myVotes } = await supabase
      .from("votes")
      .select("target_id")
      .eq("stage_run_id", activeStage.current_run_id)
      .eq("voter_id", me.id)
      .not("target_id", "is", null);
    myHeartedIds = new Set((myVotes ?? []).map((v) => v.target_id as string));
  }

  const maxSelections = activeStage?.max_selections ?? 3;
  const selectedCount = myHeartedIds.size;

  return (
    <div className="bg-bg text-gray-900 min-h-screen">
      <RealtimeRefresh
        tables={["participants", "stages", "votes"]}
        roomId={room.id}
        debounceMs={150}
      />
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full flex items-center justify-between px-4 h-14 z-50 bg-bg border-b border-primary-soft">
        <Link
          href={`/r/${code}/home`}
          className="transition-all duration-200 active:scale-95 text-primary flex items-center justify-center w-10 h-10"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-bold text-[18px] tracking-tight text-primary">
          참여자 ({people.length + 1}명)
        </h1>
        <Link
          href={`/r/${code}/my-hearts`}
          className="transition-all duration-200 active:scale-95 text-primary flex items-center justify-center w-10 h-10"
          title="내 선택"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
        </Link>
      </header>

      {/* Sticky Status Banner */}
      <div className="fixed top-14 left-0 w-full z-40 bg-accent-soft h-10 flex items-center justify-center">
        <p className="text-[13px] font-bold text-accent tracking-tight">
          {isVotingPhase
            ? `💜 ${activeStage!.name} 진행 중 · ❤ ${selectedCount}/${maxSelections}`
            : room.status === "closed"
            ? "🎉 파티 종료 — 매칭 결과 확인"
            : "⏳ 투표 단계 대기 중"}
        </p>
      </div>

      <main className="pt-28 pb-32 px-4">
        {people.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center text-slate-400 text-sm border border-primary-soft">
            아직 다른 참여자가 없습니다 — 곧 더 들어옵니다 ✨
          </div>
        ) : (
          <div className="space-y-4">
            {people.map((p, idx) => {
              const hearted = myHeartedIds.has(p.id);
              const colorIdx = (p.entry_number ?? idx) % AVATAR_COLORS.length;
              return (
                <div
                  key={p.id}
                  className={`flex rounded-lg overflow-hidden shadow-sm border ${
                    hearted ? "bg-primary-soft border-primary/10" : "bg-white border-primary-soft"
                  }`}
                >
                  <Link
                    href={`/r/${code}/people/${p.id}`}
                    className="flex-1 p-4 flex items-center gap-4"
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${AVATAR_COLORS[colorIdx]} flex items-center justify-center font-bold text-white`}
                    >
                      {p.nickname.slice(0, 1)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-[15px]">
                          #{p.entry_number} {p.nickname}
                        </h3>
                        {hearted && (
                          <span className="px-2 py-0.5 bg-primary text-white text-[10px] rounded-full font-bold">
                            ❤ 선택
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {new Date(p.joined_at).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        입장
                      </p>
                    </div>
                  </Link>
                  {isVotingPhase && (
                    <form
                      action={async () => {
                        "use server";
                        await toggleHeart(code, p.id);
                      }}
                      className="border-l border-primary-soft/50"
                    >
                      <button
                        type="submit"
                        className="w-14 h-full flex items-center justify-center active:scale-90 transition-transform"
                        title={hearted ? "❤ 취소" : "❤ 보내기"}
                      >
                        <span
                          className={`material-symbols-outlined text-2xl ${
                            hearted ? "text-primary" : "text-gray-300"
                          }`}
                          style={hearted ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          favorite
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-2 pb-3 h-20 bg-white border-t border-primary-soft rounded-t-3xl shadow-[0_-4px_12px_rgba(255,77,109,0.08)]">
        <Link
          href={`/r/${code}/home`}
          className="flex flex-col items-center justify-center text-gray-400 active:scale-90 transition-transform duration-200"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[11px] font-medium">홈</span>
        </Link>
        <button className="flex flex-col items-center justify-center bg-primary-soft text-primary rounded-full px-4 py-1.5 active:scale-90 transition-transform duration-200">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            group
          </span>
          <span className="text-[11px] font-medium">참여자</span>
        </button>
        <Link
          href={`/r/${code}/matches`}
          className="flex flex-col items-center justify-center text-gray-400 active:scale-90 transition-transform duration-200"
        >
          <span className="material-symbols-outlined">favorite</span>
          <span className="text-[11px] font-medium">매칭</span>
        </Link>
      </nav>
    </div>
  );
}
