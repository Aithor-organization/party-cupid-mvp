// A-4 닉네임 입력 — Server Action으로 anonymous auth + INSERT 처리
// (쿠키 동기화 보장 + 클라이언트 timing 이슈 회피)
import Link from "next/link";
import { Suspense } from "react";
import { enterRoomAndRedirect } from "./actions";

function ErrorBanner({ error }: { error: string | undefined }) {
  if (!error) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      ⚠️ {decodeURIComponent(error)}
    </div>
  );
}

export default function NicknamePage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { error?: string };
}) {
  return (
    <main className="min-h-screen p-6 max-w-md mx-auto flex items-center">
      <div className="card w-full">
        <h1 className="text-xl font-bold mb-4">방에 들어가기</h1>

        <form action={enterRoomAndRedirect} className="space-y-4">
          <input type="hidden" name="code" value={params.code} />

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nickname">
              닉네임 (1~20자)
            </label>
            <input
              id="nickname"
              type="text"
              name="nickname"
              required
              minLength={1}
              maxLength={20}
              autoFocus
              className="input"
              placeholder="예: 캔디팝"
            />
          </div>

          <p className="text-xs text-gray-500">
            💡 한 기기에서 계속 사용해 주세요. 다른 기기에서는 다시 입장해야 해요.
          </p>

          <Suspense fallback={null}>
            <ErrorBanner error={searchParams.error} />
          </Suspense>

          <button type="submit" className="btn-primary w-full">
            입장하기
          </button>
        </form>

        <Link
          href={`/r/${params.code}/consent`}
          className="block text-center text-sm text-gray-500 mt-4"
        >
          ← 약관으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
