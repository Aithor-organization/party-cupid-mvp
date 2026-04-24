// PUB-3 주최자 회원가입
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) { setError("이용약관에 동의해 주세요"); return; }
    if (password.length < 8) { setError("비밀번호는 8자 이상"); return; }

    setLoading(true);
    setError(null);

    // 이메일 confirm 비활성화 가정 — 가입 즉시 세션 발급
    // (Supabase 대시보드 → Authentication → Providers → Email → "Confirm email" OFF 필요)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (error) { setError(error.message); setLoading(false); return; }

    // confirm OFF면 session이 즉시 발급됨
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // confirm이 ON으로 잘못 설정된 경우 fallback
    setError("관리자에게 문의: 이메일 인증이 활성화되어 있습니다 (Supabase 설정 확인 필요)");
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md card">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-primary">💝 Party Cupid</Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">회원가입</h1>
          <p className="text-sm text-gray-500">파티 주최자만 가입합니다</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이름 (표시 이름)</label>
            <input type="text" required className="input"
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input type="email" required className="input"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호 (8자 이상)</label>
            <input type="password" required minLength={8} className="input"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={agree}
              onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
            <span>이용약관 및 개인정보 처리방침에 동의합니다 (필수)</span>
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있나요? <Link href="/login" className="text-primary font-semibold">로그인</Link>
        </p>
      </div>
    </main>
  );
}
