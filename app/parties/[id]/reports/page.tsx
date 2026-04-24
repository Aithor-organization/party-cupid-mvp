// 호스트 신고 처리 페이지
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveReport } from "../actions";

export default async function ReportsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, host_id, code")
    .eq("id", params.id)
    .single();
  if (!room) notFound();
  if (room.host_id !== user.id) redirect("/dashboard");

  // 신고 + 신고자/대상 정보 join
  const { data: reportsRaw } = await supabase
    .from("reports")
    .select(
      "id, reason, status, created_at, reporter_id, target_participant_id, target_message_id",
    )
    .eq("room_id", room.id)
    .order("created_at", { ascending: false });
  const reports = reportsRaw ?? [];

  // 참여자 매핑
  const participantIds = Array.from(
    new Set(
      reports.flatMap((r) =>
        [r.reporter_id, r.target_participant_id].filter(Boolean) as string[],
      ),
    ),
  );
  const participantMap = new Map<string, { nickname: string; entry_number: number }>();
  if (participantIds.length > 0) {
    const { data: parts } = await supabase
      .from("participants")
      .select("id, nickname, entry_number")
      .in("id", participantIds);
    for (const p of parts ?? []) participantMap.set(p.id, p);
  }

  // 메시지 매핑 (신고된 메시지 본문)
  const messageIds = reports
    .map((r) => r.target_message_id)
    .filter((x): x is string => !!x);
  const messageMap = new Map<string, { body: string; is_hidden: boolean }>();
  if (messageIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, body, is_hidden")
      .in("id", messageIds);
    for (const m of msgs ?? []) messageMap.set(m.id, { body: m.body, is_hidden: m.is_hidden });
  }

  const pendingCount = reports.filter((r) => r.status === "pending").length;

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
          <h1 className="text-xl font-bold">🚨 신고 처리 — {room.name}</h1>
        </div>
        <span className="px-3 py-1 bg-danger text-white text-xs font-bold rounded-full">
          대기 {pendingCount}건
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center text-slate-400 border border-rose-50">
            <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">
              shield_check
            </span>
            <p className="text-[15px] font-medium">신고가 없습니다</p>
          </div>
        ) : (
          reports.map((r) => {
            const reporter = participantMap.get(r.reporter_id);
            const target = r.target_participant_id
              ? participantMap.get(r.target_participant_id)
              : null;
            const message = r.target_message_id ? messageMap.get(r.target_message_id) : null;
            const isPending = r.status === "pending";

            return (
              <div
                key={r.id}
                className={`bg-white rounded-lg p-5 border-2 ${
                  isPending ? "border-danger/30" : "border-slate-100 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          isPending
                            ? "bg-danger text-white"
                            : r.status === "resolved"
                            ? "bg-success-soft text-success"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {r.status === "pending"
                          ? "대기"
                          : r.status === "resolved"
                          ? "처리됨"
                          : "기각"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(r.created_at).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      <strong>신고자</strong>:{" "}
                      {reporter
                        ? `#${reporter.entry_number} ${reporter.nickname}`
                        : "(알 수 없음)"}
                    </p>
                    {target && (
                      <p className="text-sm text-slate-600">
                        <strong>대상 참여자</strong>: #{target.entry_number} {target.nickname}
                      </p>
                    )}
                    {message && (
                      <div className="mt-2 bg-slate-50 rounded p-3 text-sm">
                        <p className="text-[11px] text-slate-400 mb-1">신고된 메시지:</p>
                        <p
                          className={`text-slate-800 ${
                            message.is_hidden ? "line-through opacity-50" : ""
                          }`}
                        >
                          {message.body}
                        </p>
                      </div>
                    )}
                    <p className="text-sm mt-2">
                      <strong>사유</strong>: {r.reason}
                    </p>
                  </div>
                </div>

                {isPending && (
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    {r.target_message_id && (
                      <form
                        action={async () => {
                          "use server";
                          await resolveReport(room.id, r.id, "resolve_hide");
                        }}
                      >
                        <button
                          type="submit"
                          className="px-4 py-2 bg-warning text-white text-sm font-bold rounded-lg hover:opacity-90"
                        >
                          메시지 숨기기
                        </button>
                      </form>
                    )}
                    {r.target_participant_id && (
                      <form
                        action={async () => {
                          "use server";
                          await resolveReport(room.id, r.id, "resolve_kick");
                        }}
                      >
                        <button
                          type="submit"
                          className="px-4 py-2 bg-danger text-white text-sm font-bold rounded-lg hover:opacity-90"
                        >
                          강퇴
                        </button>
                      </form>
                    )}
                    <form
                      action={async () => {
                        "use server";
                        await resolveReport(room.id, r.id, "dismiss");
                      }}
                    >
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-300"
                      >
                        기각
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
