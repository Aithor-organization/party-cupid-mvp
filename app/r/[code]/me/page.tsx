// A-12 내 정보 — 닉네임 변경 + 방 나가기
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateMyNickname, leaveRoom } from "../actions";

export default async function MyInfoPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createClient();
  const { code } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/r/${code}/nickname`);

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, code, status")
    .eq("code", code)
    .single();
  if (!room) notFound();

  const { data: me } = await supabase
    .from("participants")
    .select("id, nickname, entry_number, status, joined_at")
    .eq("room_id", room.id)
    .eq("anon_user_id", user.id)
    .single();
  if (!me || me.status !== "active") redirect(`/r/${code}/nickname`);

  const { count: myVotesCount } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("voter_id", me.id);

  return (
    <div className="bg-bg min-h-screen text-slate-900 pb-24">
      <header className="bg-bg border-b border-primary-soft flex items-center w-full px-4 h-14 sticky top-0 z-50">
        <Link
          href={`/r/${code}/home`}
          className="w-10 h-10 flex items-center justify-center text-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-bold text-[18px] text-primary flex-1 text-center pr-10">
          내 정보
        </h1>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-6">
        {/* 프로필 카드 */}
        <section className="bg-white rounded-xl p-6 border border-primary-soft text-center">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center text-3xl font-black text-white">
            {me.nickname.slice(0, 1)}
          </div>
          <h2 className="text-xl font-bold">{me.nickname}</h2>
          <p className="text-sm text-slate-500 mt-1">
            #{me.entry_number} · {new Date(me.joined_at).toLocaleString("ko-KR")}
          </p>
          <p className="text-xs text-slate-400 mt-2">방: {room.name} ({room.code})</p>
        </section>

        {/* 활동 요약 */}
        <section className="bg-white rounded-xl p-4 border border-primary-soft">
          <h3 className="text-sm font-bold mb-3 text-slate-600">활동 요약</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">보낸 ❤</span>
            <span className="font-bold">{myVotesCount ?? 0}</span>
          </div>
        </section>

        {/* 닉네임 변경 */}
        <section className="bg-white rounded-xl p-4 border border-primary-soft">
          <h3 className="text-sm font-bold mb-3 text-slate-600">닉네임 변경</h3>
          <form
            action={async (formData) => {
              "use server";
              const nick = String(formData.get("nickname") ?? "");
              await updateMyNickname(code, nick);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              name="nickname"
              defaultValue={me.nickname}
              required
              maxLength={20}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:opacity-90"
            >
              저장
            </button>
          </form>
          <p className="text-[11px] text-slate-400 mt-2">
            💡 변경하면 참여자 목록의 본인 이름도 자동 업데이트됩니다
          </p>
        </section>

        {/* 방 나가기 */}
        <section className="bg-white rounded-xl p-4 border border-danger/20">
          <h3 className="text-sm font-bold mb-2 text-danger">방 나가기</h3>
          <p className="text-xs text-slate-500 mb-3">
            나가면 본인이 보낸 ❤는 기록에 남지만 더 이상 ❤를 보낼 수 없습니다.
            같은 기기/같은 브라우저에서 동일한 닉네임으로 재입장은 불가합니다.
          </p>
          <form
            action={async () => {
              "use server";
              await leaveRoom(code);
              redirect(`/r/${code}`);
            }}
          >
            <button
              type="submit"
              className="w-full py-2.5 bg-danger/10 text-danger font-bold text-sm rounded-lg hover:bg-danger/20 transition-colors"
            >
              방 나가기
            </button>
          </form>
        </section>
      </main>

      {/* BottomNav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white border-t border-primary-soft rounded-t-3xl">
        <Link
          href={`/r/${code}/home`}
          className="flex flex-col items-center text-slate-400 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[11px] font-medium">홈</span>
        </Link>
        <Link
          href={`/r/${code}/people`}
          className="flex flex-col items-center text-slate-400 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">group</span>
          <span className="text-[11px] font-medium">참여자</span>
        </Link>
        <Link
          href={`/r/${code}/messages`}
          className="flex flex-col items-center text-slate-400 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="text-[11px] font-medium">쪽지</span>
        </Link>
        <button className="flex flex-col items-center bg-primary-soft text-primary rounded-full px-4 py-1.5">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person
          </span>
          <span className="text-[11px] font-medium">내 정보</span>
        </button>
      </nav>
    </div>
  );
}
