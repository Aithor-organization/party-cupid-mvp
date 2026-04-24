// 참여자 알림 토스트 — 새 매칭/쪽지 도착 시 알림
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Toast = {
  id: string;
  title: string;
  body: string;
  icon: string;
  linkTo?: string;
  createdAt: number;
};

type Props = {
  roomId: string;
  participantId: string;
  roomCode: string;
};

export default function NotificationToast({ roomId, participantId, roomCode }: Props) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function pushToast(t: Omit<Toast, "id" | "createdAt">) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: Toast = { ...t, id, createdAt: Date.now() };
    setToasts((prev) => [...prev, toast]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      timersRef.current.delete(id);
    }, 5000);
    timersRef.current.set(id, timer);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    const mountedAt = Date.now();

    const channel = supabase
      .channel(`notif-${roomId}-${participantId}`)
      // 매칭 알림
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `room_id=eq.${roomId}`,
        } as never,
        ((payload: { new: { participant_a_id: string; participant_b_id: string } }) => {
          // 마운트 직전 데이터는 무시 (뒤늦은 replay 방지)
          const row = payload.new;
          const involved =
            row.participant_a_id === participantId || row.participant_b_id === participantId;
          if (!involved) return;
          pushToast({
            title: "🎉 새 매칭 성사!",
            body: "누군가와 양방향 ❤이 성사되었어요",
            icon: "favorite",
            linkTo: `/r/${roomCode}/matches`,
          });
        }) as never,
      )
      // 쪽지 도착 알림
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        } as never,
        ((payload: {
          new: { receiver_id: string; sender_id: string; created_at: string };
        }) => {
          const row = payload.new;
          if (row.receiver_id !== participantId) return;
          // 마운트 전 메시지 무시
          if (new Date(row.created_at).getTime() < mountedAt - 2000) return;
          pushToast({
            title: "💌 새 쪽지 도착",
            body: "매칭 상대가 쪽지를 보냈어요",
            icon: "mail",
            linkTo: `/r/${roomCode}/messages`,
          });
        }) as never,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, participantId, roomCode]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            dismissToast(t.id);
            if (t.linkTo) router.push(t.linkTo);
          }}
          className="bg-white border-2 border-primary rounded-xl shadow-xl p-3 flex items-start gap-2 text-left animate-slide-in hover:bg-primary-soft/30 transition-colors"
          style={{ minWidth: "280px" }}
        >
          <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">
            {t.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-900">{t.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t.body}</p>
          </div>
          <span
            role="button"
            aria-label="닫기"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(t.id);
            }}
            className="material-symbols-outlined text-slate-300 hover:text-slate-500 text-[18px]"
          >
            close
          </span>
        </button>
      ))}
    </div>
  );
}
