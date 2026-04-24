// 쪽지함 — 양방향 매칭된 상대 목록 + 대화 (수신/발신 합치기)
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RealtimeRefresh from "@/components/RealtimeRefresh";

export default async function MessagesPage({
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
    .select("id, status")
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

  // 본인 매칭 (RLS로 본인이 a 또는 b인 것만)
  const { data: matches } = await supabase
    .from("matches")
    .select("id, participant_a_id, participant_b_id")
    .eq("room_id", room.id);
  const partnerIds = (matches ?? []).map((m) =>
    m.participant_a_id === me.id ? m.participant_b_id : m.participant_a_id,
  );

  // 매칭 상대 정보
  const partnerMap = new Map<string, { id: string; nickname: string; entry_number: number }>();
  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from("participants")
      .select("id, nickname, entry_number")
      .in("id", partnerIds);
    for (const p of partners ?? []) partnerMap.set(p.id, p);
  }

  // 본인 송수신 메시지
  const { data: messagesRaw } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, body, created_at, is_hidden")
    .eq("room_id", room.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });
  const messages = messagesRaw ?? [];

  // 상대별 마지막 메시지 + 미읽음 카운트(임시: 모두 읽음)
  const lastByPartner = new Map<
    string,
    { lastBody: string; lastAt: string; isMine: boolean }
  >();
  for (const m of messages) {
    const partnerId = m.sender_id === me.id ? m.receiver_id : m.sender_id;
    if (!partnerMap.has(partnerId)) continue;
    if (!lastByPartner.has(partnerId)) {
      lastByPartner.set(partnerId, {
        lastBody: m.body,
        lastAt: m.created_at,
        isMine: m.sender_id === me.id,
      });
    }
  }

  return (
    <div className="bg-bg min-h-screen text-slate-900 pb-24">
      <RealtimeRefresh tables={["messages", "matches"]} roomId={room.id} />
      {/* TopAppBar */}
      <header className="bg-bg flex justify-between items-center w-full px-4 h-16 fixed top-0 z-50 border-b border-primary-soft">
        <Link
          href={`/r/${code}/home`}
          className="w-10 h-10 flex items-center justify-center hover:bg-primary-soft rounded-full active:opacity-70 transition-all"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <h1 className="font-bold text-[18px] text-primary">💌 쪽지함</h1>
        <div className="w-10 h-10" />
      </header>

      <main className="pt-20 px-5 max-w-md mx-auto">
        {partnerIds.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-primary-soft mt-4">
            <span className="material-symbols-outlined text-slate-300 text-[48px] mb-2">
              chat_bubble_outline
            </span>
            <p className="text-slate-500 text-[15px] font-medium mb-1">
              아직 양방향 매칭이 없습니다
            </p>
            <p className="text-slate-400 text-[13px]">
              매칭이 성사되면 쪽지를 보낼 수 있습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {partnerIds.map((pid) => {
              const partner = partnerMap.get(pid);
              if (!partner) return null;
              const last = lastByPartner.get(pid);
              return (
                <Link
                  key={pid}
                  href={`/r/${code}/messages/${pid}`}
                  className="bg-white rounded-xl p-4 border border-primary-soft flex items-center gap-4 hover:bg-primary-soft/30 transition-colors active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center text-2xl font-black text-white shrink-0">
                    {partner.nickname.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-[15px]">
                        #{partner.entry_number} {partner.nickname}
                      </h3>
                      {last && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(last.lastAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-500 truncate">
                      {last
                        ? `${last.isMine ? "나: " : ""}${last.lastBody}`
                        : "쪽지를 시작해 보세요"}
                    </p>
                  </div>
                </Link>
              );
            })}
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
            chat_bubble
          </span>
          <span className="text-[11px] font-medium">쪽지</span>
        </button>
        <Link
          href={`/r/${code}/matches`}
          className="flex flex-col items-center justify-center text-slate-400 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">favorite</span>
          <span className="text-[11px] font-medium">매칭</span>
        </Link>
      </nav>
    </div>
  );
}
