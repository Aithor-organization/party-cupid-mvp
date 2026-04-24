// QR 액션 — URL 복사 + PNG 다운로드 (클라이언트 컴포넌트)
"use client";

import { useState } from "react";

type Props = {
  roomUrl: string;
  qrDataUrl: string; // data:image/png;base64,...
  roomCode: string;
};

export default function QrActions({ roomUrl, qrDataUrl, roomCode }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = roomUrl;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `party-cupid-${roomCode}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 py-3 border border-rose-100 text-slate-600 font-bold text-sm rounded-lg hover:bg-rose-50 transition-colors active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[20px]">download</span>
        PNG 다운로드
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center justify-center gap-2 py-3 border font-bold text-sm rounded-lg transition-colors active:scale-[0.98] ${
          copied
            ? "border-success bg-success-soft text-success"
            : "border-rose-100 text-slate-600 hover:bg-rose-50"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {copied ? "check" : "content_copy"}
        </span>
        {copied ? "복사됨!" : "URL 복사"}
      </button>
    </div>
  );
}
