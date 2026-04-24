// 호스트 단계 편집 — 추가/삭제/이름 변경/투표 토글
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addStage, deleteStage, moveStage, updateStage } from "../actions";

export default async function StagesEditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, host_id, status")
    .eq("id", params.id)
    .single();
  if (!room) notFound();
  if (room.host_id !== user.id) redirect("/dashboard");

  const { data: stages } = await supabase
    .from("stages")
    .select('id, "order", name, collect_vote, max_selections, status')
    .eq("room_id", room.id)
    .order("order");

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
          <h1 className="text-xl font-bold">📋 단계 편집 — {room.name}</h1>
        </div>
        <span className="px-3 py-1 bg-primary-soft text-primary text-xs font-bold rounded-full">
          {stages?.length ?? 0}단계
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-3">
        {(stages ?? []).length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center text-slate-400 border border-rose-50">
            아직 단계가 없습니다
          </div>
        ) : (
          (stages ?? []).map((s) => {
            const isLocked = s.status === "active" || s.status === "closed";
            return (
              <form
                key={s.id}
                action={async (formData) => {
                  "use server";
                  await updateStage(room.id, s.id, {
                    name: String(formData.get("name") ?? ""),
                    collect_vote: formData.get("collect_vote") === "on",
                    max_selections: Number(formData.get("max_selections") ?? 3),
                  });
                }}
                className={`bg-white rounded-lg p-4 border-l-4 flex items-center gap-4 ${
                  s.status === "active"
                    ? "border-success ring-2 ring-success/20"
                    : s.status === "closed"
                    ? "border-slate-300 opacity-60"
                    : s.collect_vote
                    ? "border-primary"
                    : "border-slate-300"
                }`}
              >
                <span className="text-xs font-bold text-slate-400 w-12">
                  단계 {s.order}
                </span>
                {!isLocked && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      formAction={async () => {
                        "use server";
                        await moveStage(room.id, s.id, "up");
                      }}
                      className="w-6 h-4 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-soft rounded text-xs"
                      title="위로"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      formAction={async () => {
                        "use server";
                        await moveStage(room.id, s.id, "down");
                      }}
                      className="w-6 h-4 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-soft rounded text-xs"
                      title="아래로"
                    >
                      ▼
                    </button>
                  </div>
                )}
                <input
                  name="name"
                  defaultValue={s.name}
                  disabled={isLocked}
                  maxLength={100}
                  required
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    name="collect_vote"
                    defaultChecked={s.collect_vote}
                    disabled={isLocked}
                    className="accent-primary"
                  />
                  ❤
                </label>
                <input
                  type="number"
                  name="max_selections"
                  defaultValue={s.max_selections}
                  disabled={isLocked || !s.collect_vote}
                  min={1}
                  max={10}
                  className="w-16 border border-slate-200 rounded-lg px-2 py-2 text-sm text-center disabled:bg-slate-50 disabled:text-slate-400"
                />
                <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                  s.status === "active" ? "bg-success-soft text-success" :
                  s.status === "closed" ? "bg-slate-100 text-slate-500" :
                  "bg-primary-soft text-primary"
                }`}>
                  {s.status === "active" ? "진행중" : s.status === "closed" ? "종료" : "준비"}
                </span>
                {!isLocked && (
                  <>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      formAction={async () => {
                        "use server";
                        await deleteStage(room.id, s.id);
                      }}
                      className="px-3 py-2 bg-danger/10 text-danger text-xs font-bold rounded-lg hover:bg-danger/20"
                    >
                      삭제
                    </button>
                  </>
                )}
              </form>
            );
          })
        )}

        {/* 단계 추가 폼 */}
        <form
          action={async (formData) => {
            "use server";
            await addStage(room.id, {
              name: String(formData.get("name") ?? ""),
              collect_vote: formData.get("collect_vote") === "on",
              max_selections: Number(formData.get("max_selections") ?? 3),
            });
          }}
          className="bg-primary-soft/30 rounded-lg p-4 border-2 border-dashed border-primary/30 flex items-center gap-4 mt-6"
        >
          <span className="text-xs font-bold text-primary w-12">
            <span className="material-symbols-outlined">add</span>
          </span>
          <input
            name="name"
            placeholder="새 단계 이름..."
            required
            maxLength={100}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" name="collect_vote" className="accent-primary" />
            ❤
          </label>
          <input
            type="number"
            name="max_selections"
            defaultValue={3}
            min={1}
            max={10}
            className="w-16 border border-slate-200 rounded-lg px-2 py-2 text-sm text-center"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90"
          >
            추가
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-4 text-center">
          ⚠️ 진행 중/종료된 단계는 수정/삭제할 수 없습니다. 준비 단계만 변경 가능.
        </p>
      </main>
    </div>
  );
}
