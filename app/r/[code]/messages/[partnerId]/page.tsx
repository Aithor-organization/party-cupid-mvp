// 1:1 쪽지 대화 — 송수신자 RLS 자동 필터
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendMessage, reportTarget } from "../../actions";
import ReportButton from "@/components/ReportButton";
import RealtimeRefresh from "@/components/RealtimeRefresh";

export default async function ConversationPage({
  params,
}: {
  params: { code: string; partnerId: string };
}) {
  const supabase = createClient();
  const { code, partnerId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/r/${code}/consent`);

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
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

  // 매칭 검증
  const a = me.id < partnerId ? me.id : partnerId;
  const b = me.id < partnerId ? partnerId : me.id;
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("room_id", room.id)
    .eq("participant_a_id", a)
    .eq("participant_b_id", b)
    .maybeSingle();
  if (!match) redirect(`/r/${code}/messages`);

  const { data: partner } = await supabase
    .from("participants")
    .select("id, nickname, entry_number")
    .eq("id", partnerId)
    .single();
  if (!partner) notFound();

  // 두 사람 사이의 메시지만 (RLS는 본인 송수신만 read 허용)
  const { data: messagesRaw } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at, is_hidden")
    .eq("room_id", room.id)
    .eq("is_hidden", false)
    .or(
      `and(sender_id.eq.${me.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${me.id})`,
    )
    .order("created_at", { ascending: true });
  const messages = messagesRaw ?? [];

  return (
    <div className="bg-bg min-h-screen text-slate-900 flex flex-col">
      <RealtimeRefresh tables={["messages"]} roomId={room.id} debounceMs={300} />
      {/* TopAppBar */}
      <header className="bg-bg flex items-center w-full px-4 h-16 sticky top-0 z-50 border-b border-primary-soft">
        <Link
          href={`/r/${code}/messages`}
          className="w-10 h-10 flex items-center justify-center hover:bg-primary-soft rounded-full active:opacity-70 transition-all"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center font-bold text-white text-sm">
            {partner.nickname.slice(0, 1)}
          </div>
          <h1 className="font-bold text-[16px]">
            #{partner.entry_number} {partner.nickname}
          </h1>
        </div>
        <ReportButton
          variant="icon"
          label="신고"
          action={async (reason) => {
            "use server";
            return await reportTarget(code, { targetParticipantId: partnerId, reason });
          }}
        />
      </header>

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-[13px] py-12">
            첫 쪽지를 보내보세요 ✨
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const isMine = m.sender_id === me.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white border border-primary-soft text-slate-900 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-[14px] break-words whitespace-pre-wrap">{m.body}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMine ? "text-white/70" : "text-slate-400"
                      }`}
                    >
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
      </main>

      {/* Input */}
      <form
        action={async (formData) => {
          "use server";
          const body = String(formData.get("body") ?? "");
          await sendMessage(code, partnerId, body);
        }}
        className="sticky bottom-0 bg-white border-t border-primary-soft px-4 py-3 flex items-end gap-2"
      >
        <textarea
          name="body"
          required
          maxLength={500}
          rows={1}
          placeholder="쪽지를 입력하세요..."
          className="flex-1 resize-none border border-slate-200 rounded-2xl px-4 py-2 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none max-h-32"
        />
        <button
          type="submit"
          className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-md shadow-primary/30"
          title="보내기"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  );
}
