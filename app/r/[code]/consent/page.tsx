// A-2 약관 동의
import Link from "next/link";

export default function ConsentPage({
  params,
}: {
  params: { code: string };
}) {
  return (
    <main className="min-h-screen p-6 max-w-md mx-auto">
      <div className="card">
        <h1 className="text-xl font-bold mb-4">파티 입장 안내</h1>

        <div className="space-y-4 text-sm text-gray-700 mb-6">
          <div className="bg-primary-soft rounded p-4">
            <strong>🎭 익명성</strong>
            <p className="mt-1">닉네임만 사용하며, 다른 참여자에게 본인 정보는 공개되지 않습니다.</p>
          </div>

          <div className="bg-warning-surface rounded p-4">
            <strong>👀 주최자 권한</strong>
            <p className="mt-1">
              주최자는 모든 표/쪽지/매칭 데이터를 열람할 수 있습니다 (조작은 시스템적으로 불가).
            </p>
          </div>

          <div className="bg-accent-soft rounded p-4">
            <strong>📱 한 기기 사용 권장</strong>
            <p className="mt-1">
              세션은 이 기기에 저장됩니다. 다른 기기에서는 다시 입장해야 합니다.
            </p>
          </div>
        </div>

        <Link
          href={`/r/${params.code}/nickname`}
          className="btn-primary w-full block text-center"
        >
          동의하고 입장하기
        </Link>

        <Link href="/" className="block text-center text-sm text-gray-500 mt-4">
          나가기
        </Link>
      </div>
    </main>
  );
}
