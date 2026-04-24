// 단계 카운트다운 타이머 — stage_runs.opened_at + trigger_timer_minutes
"use client";

import { useEffect, useState } from "react";

type Props = {
  openedAt: string; // ISO8601
  timerMinutes: number | null | undefined;
  label?: string;
};

function formatDuration(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function StageTimer({ openedAt, timerMinutes, label }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timerMinutes || timerMinutes <= 0) return null;

  const endMs = new Date(openedAt).getTime() + timerMinutes * 60_000;
  const remaining = endMs - now;
  const expired = remaining <= 0;
  const urgent = remaining > 0 && remaining < 60_000;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${
        expired
          ? "bg-slate-100 text-slate-400"
          : urgent
          ? "bg-danger text-white animate-pulse"
          : "bg-warning-surface text-warning"
      }`}
    >
      <span className="material-symbols-outlined text-[14px]">
        {expired ? "schedule" : "timer"}
      </span>
      {expired
        ? `${label ?? "단계"} 마감`
        : `${label ?? "마감"} ${formatDuration(remaining)}`}
    </div>
  );
}
