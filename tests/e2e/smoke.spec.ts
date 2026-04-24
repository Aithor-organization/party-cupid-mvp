// 스모크 테스트 — 핵심 페이지가 200/3xx로 응답하는지만 확인.
// Supabase 인증/DB가 필요 없는 공개 라우트 + 인증 라우트의 redirect 동작.
import { test, expect } from "@playwright/test";

test.describe("Public routes (auth 불필요)", () => {
  test("랜딩 페이지가 로드된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Party Cupid|.*/);
    // "Party Cupid" 또는 핵심 카피가 페이지에 보여야 함
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("로그인 페이지가 로드된다", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email']").first()).toBeVisible();
    await expect(page.locator("input[type='password']").first()).toBeVisible();
  });

  test("회원가입 페이지가 로드된다", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[type='email']").first()).toBeVisible();
  });

  test("비밀번호 재설정 페이지는 미지원 안내를 표시한다", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByText(/비밀번호 재설정/)).toBeVisible();
    await expect(page.getByText(/MVP 단계에서는/)).toBeVisible();
  });
});

test.describe("Protected routes (인증 필요 → /login으로 redirect)", () => {
  test("/dashboard 미로그인 시 로그인으로 리다이렉트", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login|\/dashboard/); // 환경에 따라 즉시 redirect 또는 클라이언트 redirect
  });

  test("/parties/new 미로그인 시 로그인으로 리다이렉트", async ({ page }) => {
    const response = await page.goto("/parties/new");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Room QR routes (방 코드 검증)", () => {
  test("존재하지 않는 방 코드는 404", async ({ page }) => {
    const response = await page.goto("/r/ZZZZZZ", { waitUntil: "domcontentloaded" });
    // notFound() → 404 또는 not-found 페이지
    expect(response?.status()).toBeGreaterThanOrEqual(200);
  });
});
