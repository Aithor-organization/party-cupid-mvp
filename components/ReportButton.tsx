// 신고 버튼 — 사유 선택 + 확인 다이얼로그
"use client";

import { useState, useTransition } from "react";

const PRESET_REASONS = [
  "부적절한 행동/언행",
  "스팸/광고",
  "욕설/혐오 표현",
  "사칭/가짜 프로필",
  "기타",
] as const;

type Props = {
  action: (reason: string) => Promise<{ ok: boolean; error?: string } | void>;
  variant?: "icon" | "text";
  label?: string;
};

export default function ReportButton({ action, variant = "icon", label = "신고하기" }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function submit() {
    const finalReason = reason === "기타" ? customReason.trim() : reason;
    if (!finalReason) {
      setFeedback("사유를 입력해 주세요");
      return;
    }
    startTransition(async () => {
      const result = await action(finalReason);
      if (result && !result.ok) {
        setFeedback(result.error ?? "신고 실패");
        return;
      }
      setFeedback("신고가 접수되었습니다");
      setTimeout(() => {
        setOpen(false);
        setFeedback(null);
        setReason(PRESET_REASONS[0]);
        setCustomReason("");
      }, 1500);
    });
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] text-slate-400 hover:text-danger transition-colors"
          title={label}
          aria-label={label}
        >
          <span className="material-symbols-outlined">flag</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-slate-400 text-[13px] flex items-center gap-1 hover:text-danger transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">flag</span>
          {label}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-danger">flag</span>
              <h3 className="font-bold text-base">신고하기</h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              신고 내용은 호스트가 검토합니다. 허위 신고 시 본인이 제재될 수 있어요.
            </p>

            <div className="space-y-2 mb-4">
              {PRESET_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reason === r
                      ? "border-primary bg-primary-soft/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    disabled={isPending}
                    className="accent-primary"
                  />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>

            {reason === "기타" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="구체적인 사유를 입력해 주세요"
                maxLength={200}
                rows={3}
                disabled={isPending}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none mb-3"
              />
            )}

            {feedback && (
              <p
                className={`text-xs mb-3 ${
                  feedback.includes("접수") ? "text-success" : "text-danger"
                }`}
              >
                {feedback}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={isPending}
                className="flex-1 py-2.5 bg-danger text-white font-bold text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "전송 중..." : "신고"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
