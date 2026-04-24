// PUB-5 OAuth/매직 링크 콜백 — Supabase 세션 교환
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 에러 또는 코드 없음 → 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
