// H-1 주최자 대시보드 — 방 목록 + 새 파티 만들기
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteRoomButton from "@/components/DeleteRoomButton";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // 내 방 목록 fetch (RLS: host_id = auth.uid()인 방만)
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, code, name, status, max_participants, created_at")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  async function signOut() {
    "use server";
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <Link href="/" className="text-xl font-bold text-primary">💝 Party Cupid</Link>
        <div className="flex items-center gap-4 text-sm">
          <span>안녕하세요, <strong>{profile?.display_name ?? user.email}</strong></span>
          <form action={signOut}>
            <button type="submit" className="text-gray-600 hover:underline">로그아웃</button>
          </form>
        </div>
      </header>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">내 파티 목록</h1>
        <Link href="/parties/new" className="btn-primary">
          + 새 파티 만들기
        </Link>
      </div>

      {!rooms || rooms.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-gray-500 mb-4">아직 만든 파티가 없습니다</p>
          <Link href="/parties/new" className="btn-primary inline-block">
            첫 파티 만들기 →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <div key={room.id} className="relative">
              <DeleteRoomButton
                roomId={room.id}
                roomName={room.name}
                status={room.status}
              />
              <Link
                href={`/parties/${room.id}`}
                className="card hover:-translate-y-1 transition-transform block"
              >
                <div className="flex items-start justify-between mb-2 pr-8">
                  <h2 className="text-lg font-bold">{room.name}</h2>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded ${
                      room.status === "live"
                        ? "bg-success-soft text-success"
                        : room.status === "closed"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-primary-soft text-primary"
                    }`}
                  >
                    {room.status === "live" ? "LIVE" : room.status === "closed" ? "종료" : "준비"}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>방 코드: <strong className="text-primary">{room.code}</strong></p>
                  <p>최대 {room.max_participants}명</p>
                  <p className="text-xs">{new Date(room.created_at).toLocaleString("ko-KR")}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
