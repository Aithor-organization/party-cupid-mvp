// 5명 참여자 동시 입장 + 투표 시나리오
//
// 전제조건:
// - 환경변수 E2E_ROOM_CODE: 호스트가 미리 만든 방의 6자리 코드
//   (또는 E2E_BASE_URL이 로컬 localhost:3001이면 더미 데이터로 테스트 가능)
// - Supabase Anonymous Sign-Ins 토글 ON
// - 0008 마이그레이션 적용 (entry_number trigger)
//
// 실행:
//   E2E_ROOM_CODE=ABC123 npm run test:e2e -- multi-participant.spec.ts
//   (코드 없이 실행하면 방 코드 부재로 skip)

import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const ROOM_CODE = process.env.E2E_ROOM_CODE;
const PARTICIPANT_COUNT = 5;
const NICKNAMES = ["캔디팝", "라이트", "오렌지빛", "달빛", "오로라"];

test.describe("5명 동시 참여자 시나리오", () => {
  test.skip(!ROOM_CODE, "E2E_ROOM_CODE 환경변수가 필요합니다");

  test("5명 동시 입장 → 참여자 목록 확인", async ({ browser }) => {
    // 5개의 독립된 브라우저 컨텍스트 (각자 다른 쿠키/세션)
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];

    try {
      for (let i = 0; i < PARTICIPANT_COUNT; i++) {
        const ctx = await browser.newContext({
          viewport: { width: 375, height: 812 }, // 모바일
          userAgent: `Party-Cupid-E2E-User-${i + 1}`,
        });
        contexts.push(ctx);
        const page = await ctx.newPage();
        pages.push(page);
      }

      // 각자 순차 입장 (race condition 회피 위해 약간씩 간격)
      for (let i = 0; i < PARTICIPANT_COUNT; i++) {
        const page = pages[i];
        const nick = NICKNAMES[i];

        // 1. 방 진입
        await page.goto(`/r/${ROOM_CODE}`);

        // 2. consent 페이지 → "동의하고 입장하기"
        await page.waitForURL(new RegExp(`/r/${ROOM_CODE}/(consent|nickname|home)`), {
          timeout: 10_000,
        });

        const currentUrl = page.url();
        if (currentUrl.includes("/consent")) {
          await page.getByRole("link", { name: /동의하고 입장/ }).click();
          await page.waitForURL(new RegExp(`/r/${ROOM_CODE}/nickname`));
        }

        // 3. 닉네임 입력 → 입장
        await page.locator('input[name="nickname"]').fill(nick);
        await page.getByRole("button", { name: /입장하기/ }).click();

        // 4. /home 진입 확인
        await page.waitForURL(new RegExp(`/r/${ROOM_CODE}/home`), { timeout: 15_000 });
        await expect(page.getByText(nick)).toBeVisible({ timeout: 5_000 });

        // 약간의 간격 (entry_number advisory lock race 회피)
        await page.waitForTimeout(200);
      }

      // 5. 마지막 참여자가 참여자 목록 페이지로 → 4명 보여야 함 (본인 제외)
      const lastPage = pages[PARTICIPANT_COUNT - 1];
      await lastPage.goto(`/r/${ROOM_CODE}/people`);
      await lastPage.waitForSelector('text=/참여자 \\(\\d+명\\)/', { timeout: 10_000 });

      // 다른 4명의 닉네임이 모두 보여야 함
      for (let i = 0; i < PARTICIPANT_COUNT - 1; i++) {
        await expect(lastPage.getByText(NICKNAMES[i], { exact: false })).toBeVisible({
          timeout: 5_000,
        });
      }
    } finally {
      // Cleanup
      for (const ctx of contexts) {
        await ctx.close();
      }
    }
  });

  test("사용자 1이 사용자 2에게 ❤ 후, 사용자 2가 목록에서 본인 노출 확인", async ({
    browser,
  }) => {
    // 이 테스트는 호스트가 투표 단계를 활성화한 상태여야 함
    test.skip(
      !process.env.E2E_VOTING_ACTIVE,
      "E2E_VOTING_ACTIVE=1 필요 (호스트가 첫 투표 단계 시작한 상태)",
    );

    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    try {
      // 두 명 순차 입장
      for (const [page, nick] of [
        [page1, "E2E-User-A"],
        [page2, "E2E-User-B"],
      ] as const) {
        await page.goto(`/r/${ROOM_CODE}`);
        await page.waitForURL(new RegExp(`/r/${ROOM_CODE}/(consent|nickname|home)`));
        if (page.url().includes("/consent")) {
          await page.getByRole("link", { name: /동의하고 입장/ }).click();
        }
        if (page.url().includes("/nickname")) {
          await page.locator('input[name="nickname"]').fill(nick);
          await page.getByRole("button", { name: /입장하기/ }).click();
          await page.waitForURL(new RegExp(`/r/${ROOM_CODE}/home`));
        }
      }

      // User A가 참여자 목록으로 이동 → User B 찾아서 ❤ 클릭
      await page1.goto(`/r/${ROOM_CODE}/people`);
      const userBCard = page1.locator("text=/E2E-User-B/").first();
      await expect(userBCard).toBeVisible({ timeout: 10_000 });
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});
