// A-13 매칭 결과 — 본인이 참여한 매칭만 표시 (양방향 ❤만)
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MatchesPage({
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
    .select("id, nickname, entry_number, status")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .single();
  if (!me || me.status !== "active") redirect(`/r/${code}/consent`);

  // 본인이 a 또는 b인 매칭 (RLS로 자동 필터)
  const { data: matchesRaw } = await supabase
    .from("matches")
    .select("id, participant_a_id, participant_b_id, matched_stage_id, created_at")
    .eq("room_id", room.id)
    .order("created_at", { ascending: false });
  const matches = matchesRaw ?? [];

  // 상대 participant 정보
  const partnerIds = Array.from(
    new Set(
      matches.map((m) =>
        m.participant_a_id === me.id ? m.participant_b_id : m.participant_a_id,
      ),
    ),
  );
  const partnerMap = new Map<string, { id: string; nickname: string; entry_number: number }>();
  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from("participants")
      .select("id, nickname, entry_number")
      .in("id", partnerIds);
    for (const p of partners ?? []) {
      partnerMap.set(p.id, p);
    }
  }

  // 단계 이름
  const stageIds = Array.from(new Set(matches.map((m) => m.matched_stage_id)));
  const stageMap = new Map<string, string>();
  if (stageIds.length > 0) {
    const { data: stages } = await supabase
      .from("stages")
      .select("id, name")
      .in("id", stageIds);
    for (const s of stages ?? []) {
      stageMap.set(s.id, s.name);
    }
  }

  const matchesEnriched = matches
    .map((m) => {
      const partnerId = m.participant_a_id === me.id ? m.participant_b_id : m.participant_a_id;
      const partner = partnerMap.get(partnerId);
      if (!partner) return null;
      return {
        id: m.id,
        partner,
        stageName: stageMap.get(m.matched_stage_id) ?? "단계",
        createdAt: m.created_at,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const isClosed = room.status === "closed";

  return (
    <div className="bg-bg min-h-screen text-slate-900 pb-24">
      {/* TopAppBar */}
      <header className="bg-bg flex justify-between items-center w-full px-4 h-16 fixed top-0 z-50 border-b border-primary-soft">
        <Link
          href={`/r/${code}/home`}
          className="w-10 h-10 flex items-center justify-center hover:bg-primary-soft rounded-full active:opacity-70 transition-all"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <h1 className="font-bold text-[18px] text-primary">💝 매칭 결과</h1>
        <div className="w-10 h-10" />
      </header>

      <main className="pt-20 px-5 max-w-md mx-auto">
        {/* Status Banner */}
        <section
          className={`rounded-xl p-5 mb-6 ${
            isClosed ? "bg-primary-soft border border-primary/10" : "bg-accent-soft border border-accent/10"
          }`}
        >
          <h2 className="text-[18px] font-bold mb-1">
            {isClosed ? "🎉 파티 종료 — 매칭 공개" : "⏳ 파티 진행 중"}
          </h2>
          <p className="text-[13px] text-slate-600">
            {isClosed
              ? `총 ${matchesEnriched.length}명과 양방향 ❤로 매칭되었습니다`
              : "매칭은 파티 종료 후 공개됩니다"}
          </p>
        </section>

        {!isClosed ? (
          <div className="bg-white rounded-xl p-8 text-center border border-primary-soft">
            <span className="material-symbols-outlined text-slate-300 text-[48px] mb-2">
              hourglass_top
            </span>
            <p className="text-slate-500 text-[15px] font-medium mb-1">
              아직 결과를 공개할 수 없습니다
            </p>
            <p className="text-slate-400 text-[13px]">
              호스트가 마지막 단계를 종료하면 결과가 공개됩니다
            </p>
          </div>
        ) : matchesEnriched.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-primary-soft">
            <span className="material-symbols-outlined text-slate-300 text-[48px] mb-2">
              sentiment_neutral
            </span>
            <p className="text-slate-500 text-[15px] font-medium mb-1">
              이번에는 매칭이 없네요
            </p>
            <p className="text-slate-400 text-[13px]">다음 파티에서 또 만나요 🌸</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchesEnriched.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl p-5 border-2 border-primary/20 shadow-sm flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center text-2xl font-black text-white">
                  {m.partner.nickname.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[18px] font-bold">
                      #{m.partner.entry_number} {m.partner.nickname}
                    </h3>
                    <span
                      className="material-symbols-outlined text-primary text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500">
                    {m.stageName}에서 양방향 ❤
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white border-t border-primary-soft rounded-t-3xl shadow-[0_-4px_20px_rgba(255,77,109,0.1)]">
        <Link
          href={`/r/${code}/home`}
          className="flex flex-col items-center justify-center text-slate-400 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[11px] font-medium">홈</span>
        </Link>
        <Link
          href={`/r/${code}/people`}
          className="flex flex-col items-center justify-center text-slate-400 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">group</span>
          <span className="text-[11px] font-medium">참여자</span>
        </Link>
        <button className="flex flex-col items-center justify-center bg-primary-soft text-primary rounded-full px-4 py-1.5 active:scale-90 transition-transform">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <span className="text-[11px] font-medium">매칭</span>
        </button>
      </nav>
    </div>
  );
}
