// QR 이미지 클릭 시 풀스크린 확대 모달
"use client";

import { useState, useEffect } from "react";

type Props = {
  qrDataUrl: string;
  roomUrl: string;
  roomCode: string;
};

export default function QrViewer({ qrDataUrl, roomUrl, roomCode }: Props) {
  const [open, setOpen] = useState(false);

  // ESC 키로 닫기 + 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* 작은 QR — 클릭 가능 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-[240px] h-[240px] bg-white rounded-lg flex items-center justify-center border-2 border-rose-100 relative group cursor-pointer hover:border-rose-300 transition-colors"
        aria-label="QR 코드 확대"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR for ${roomUrl}`} className="w-[200px] h-[200px]" />
        <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
          <span className="material-symbols-outlined text-rose-500 text-4xl">zoom_in</span>
        </div>
      </button>

      {/* 풀스크린 모달 */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="QR 코드 확대 보기"
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full flex flex-col items-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR for ${roomUrl}`}
              className="w-full max-w-[400px] aspect-square"
            />
            <p className="mt-4 text-slate-400 text-xs font-medium tracking-wider">ROOM URL</p>
            <p className="mt-1 text-rose-600 font-bold text-base break-all text-center">
              {roomUrl.replace(/^https?:\/\//, "")}
            </p>
            <p className="mt-4 text-slate-500 text-sm text-center">
              참여자가 카메라로 스캔하면 즉시 입장합니다 · 코드: <strong>{roomCode}</strong>
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 px-6 py-2.5 bg-rose-500 text-white font-bold rounded-full hover:bg-rose-600 transition-colors"
            >
              닫기 (ESC)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
