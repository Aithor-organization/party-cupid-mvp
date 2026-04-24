// PUB-4 비밀번호 재설정 — MVP 단계에서는 미지원, 안내 페이지로 대체
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-md card text-center">
        <div className="text-5xl mb-3">🔐</div>
        <h1 className="text-2xl font-bold mb-3">비밀번호 재설정</h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          현재 MVP 단계에서는 비밀번호 재설정 메일 기능을 제공하지 않습니다.
          <br />
          계정 복구가 필요하시면 운영팀에 문의해 주세요.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-[13px] text-amber-900 mb-6">
          <p className="font-bold mb-1">💡 임시 안내</p>
          <ul className="list-disc list-inside space-y-1 text-amber-800">
            <li>이메일을 잊은 경우: 가입 시 사용한 주소 확인</li>
            <li>비밀번호만 잊은 경우: 새 계정으로 가입 가능</li>
            <li>운영 데이터 이관: 운영팀 문의 필요</li>
          </ul>
        </div>
        <div className="flex gap-2 justify-center">
          <Link href="/login" className="btn-primary inline-block">
            로그인으로 돌아가기
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 border border-primary text-primary font-bold rounded-lg hover:bg-primary-soft transition-colors"
          >
            새 계정 만들기
          </Link>
        </div>
      </div>
    </main>
  );
}
