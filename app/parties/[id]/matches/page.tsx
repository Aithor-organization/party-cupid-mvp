// 호스트 매칭 결과 — 전체 매칭 쌍 (실명/닉네임 매핑 가능)
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HostMatchesPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, host_id, status, code")
    .eq("id", params.id)
    .single();
  if (!room) notFound();
  if (room.host_id !== user.id) redirect("/dashboard");

  const { data: matches } = await supabase
    .from("matches")
    .select("id, participant_a_id, participant_b_id, matched_stage_id, created_at")
    .eq("room_id", room.id)
    .order("created_at", { ascending: false });

  const participantIds = Array.from(
    new Set(
      (matches ?? []).flatMap((m) => [m.participant_a_id, m.participant_b_id]),
    ),
  );
  const partsMap = new Map<string, { nickname: string; entry_number: number }>();
  if (participantIds.length > 0) {
    const { data: parts } = await supabase
      .from("participants")
      .select("id, nickname, entry_number")
      .in("id", participantIds);
    for (const p of parts ?? []) partsMap.set(p.id, p);
  }

  const stageIds = Array.from(new Set((matches ?? []).map((m) => m.matched_stage_id)));
  const stageMap = new Map<string, { name: string; order: number }>();
  if (stageIds.length > 0) {
    const { data: stages } = await supabase
      .from("stages")
      .select('id, name, "order"')
      .in("id", stageIds);
    for (const s of stages ?? []) stageMap.set(s.id, { name: s.name, order: s.order });
  }

  // 단계별 매칭 통계
  const byStage = new Map<string, number>();
  for (const m of matches ?? []) {
    byStage.set(m.matched_stage_id, (byStage.get(m.matched_stage_id) ?? 0) + 1);
  }

  return (
    <div className="bg-bg min-h-screen text-slate-900">
      <header className="bg-white border-b border-rose-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/parties/${room.id}`}
            className="flex items-center text-slate-600 hover:text-rose-500 gap-1 text-sm font-medium"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            라이브 운영
          </Link>
          <div className="h-4 w-px bg-rose-100"></div>
          <h1 className="text-xl font-bold">💝 매칭 결과 — {room.name}</h1>
        </div>
        <span className="px-3 py-1 bg-success text-white text-xs font-bold rounded-full">
          {matches?.length ?? 0}쌍
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* 단계별 요약 */}
        <section className="bg-white rounded-lg p-6 border border-rose-50">
          <h2 className="text-lg font-bold mb-4">📊 단계별 매칭 통계</h2>
          {byStage.size === 0 ? (
            <p className="text-slate-400 text-sm">아직 매칭이 없습니다</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from(byStage.entries())
                .sort(([a], [b]) => (stageMap.get(a)?.order ?? 0) - (stageMap.get(b)?.order ?? 0))
                .map(([sid, count]) => (
                  <div key={sid} className="bg-primary-soft rounded-lg p-4 text-center">
                    <p className="text-[11px] text-slate-500 mb-1">
                      단계 {stageMap.get(sid)?.order ?? "?"}
                    </p>
                    <p className="text-sm font-bold text-primary mb-1">
                      {stageMap.get(sid)?.name ?? "?"}
                    </p>
                    <p className="text-2xl font-black text-primary">{count}</p>
                    <p className="text-[10px] text-slate-400">쌍</p>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* 매칭 쌍 목록 */}
        <section className="bg-white rounded-lg p-6 border border-rose-50">
          <h2 className="text-lg font-bold mb-4">💞 매칭 쌍 ({matches?.length ?? 0})</h2>
          {!matches || matches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">
                favorite_border
              </span>
              <p className="text-sm">
                {room.status === "closed"
                  ? "이 파티에서 양방향 매칭이 발생하지 않았습니다"
                  : "파티 종료 후 매칭이 자동 계산됩니다"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const a = partsMap.get(m.participant_a_id);
                const b = partsMap.get(m.participant_b_id);
                const stage = stageMap.get(m.matched_stage_id);
                if (!a || !b) return null;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 bg-primary-soft/30 rounded-lg p-4 border border-primary-soft"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center font-bold text-white">
                        {a.nickname.slice(0, 1)}
                      </div>
                      <span className="font-bold text-sm">
                        #{a.entry_number} {a.nickname}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="font-bold text-sm">
                        #{b.entry_number} {b.nickname}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-cyan-300 flex items-center justify-center font-bold text-white">
                        {b.nickname.slice(0, 1)}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-[10px] text-slate-400">{stage?.name ?? ""}</p>
                      <p className="text-[10px] text-slate-300">
                        {new Date(m.created_at).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
