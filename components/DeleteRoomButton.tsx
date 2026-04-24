// 파티 삭제 버튼 — confirm 다이얼로그 + Server Action 호출
"use client";

import { useTransition, useState } from "react";
import { deleteRoom } from "@/app/dashboard/actions";

type Props = {
  roomId: string;
  roomName: string;
  status: string;
};

export default function DeleteRoomButton({ roomId, roomName, status }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    const ok = window.confirm(
      `정말로 "${roomName}" 파티를 삭제하시겠습니까?\n\n` +
        `이 작업은 되돌릴 수 없으며, 파티의 모든 참여자/투표/매칭 데이터도 함께 삭제됩니다.`,
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteRoom(roomId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || status === "live"}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full text-slate-300 hover:text-danger hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={status === "live" ? "진행 중인 파티는 먼저 종료해야 합니다" : "파티 삭제"}
        aria-label="파티 삭제"
      >
        <span className="material-symbols-outlined text-[18px]">
          {pending ? "hourglass_top" : "delete"}
        </span>
      </button>
      {error && (
        <div className="absolute top-10 right-2 z-20 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-[11px] max-w-[200px]">
          ⚠️ {error}
        </div>
      )}
    </>
  );
}
