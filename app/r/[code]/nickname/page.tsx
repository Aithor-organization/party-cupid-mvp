// A-4 닉네임 입력 + Anonymous Auth (v6 핵심 플로우)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NicknamePage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault();
    if (nickname.trim().length < 1) { setError("닉네임을 입력해 주세요"); return; }
    if (nickname.length > 20) { setError("닉네임은 20자 이내"); return; }

    setLoading(true);
    setError(null);

    // 1. 방 조회 (code → id)
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", params.code)
      .single();

    if (roomError || !room) {
      setError("방을 찾을 수 없습니다");
      setLoading(false);
      return;
    }

    // 2. Anonymous Auth (이미 세션 있으면 그대로 사용)
    const { data: { user } } = await supabase.auth.getUser();
    let userId = user?.id;

    if (!userId) {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError || !anonData.user) {
        setError(`인증 실패: ${anonError?.message ?? "unknown"}`);
        setLoading(false);
        return;
      }
      userId = anonData.user.id;
    }

    // 3. participants INSERT
    const { error: insertError } = await supabase
      .from("participants")
      .insert({
        room_id: room.id,
        anon_user_id: userId,
        nickname: nickname.trim(),
      });

    if (insertError) {
      // 이미 같은 방에 입장한 경우 (UNIQUE 제약)
      if (insertError.code === "23505") {
        router.push(`/r/${params.code}/home`);
        return;
      }
      // not-null violation (entry_number 등) → 0008 마이그레이션 미적용
      if (insertError.code === "23502") {
        console.error("[nickname] 23502:", insertError);
        setError(
          "DB 마이그레이션 0008이 적용되지 않았습니다. 운영자에게 문의해 주세요.",
        );
        setLoading(false);
        return;
      }
      // RLS 차단 또는 기타
      console.error("[nickname] insert error:", insertError);
      setError(`입장 실패 (${insertError.code ?? "?"}): ${insertError.message}`);
      setLoading(false);
      return;
    }

    router.push(`/r/${params.code}/home`);
    router.refresh();
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto flex items-center">
      <div className="card w-full">
        <h1 className="text-xl font-bold mb-4">방에 들어가기</h1>

        <form onSubmit={handleEnter} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              닉네임 (1~20자)
            </label>
            <input
              type="text"
              required
              maxLength={20}
              autoFocus
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 캔디팝"
            />
          </div>

          <p className="text-xs text-gray-500">
            💡 한 기기에서 계속 사용해 주세요. 다른 기기에서는 다시 입장해야 해요.
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "입장 중..." : "입장하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
