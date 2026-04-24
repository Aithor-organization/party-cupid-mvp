// Supabase Realtime 구독 → router.refresh()로 server component 재로드
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  /** Postgres 테이블 이름 (예: "messages", "votes", "stages", "matches", "participants") */
  tables: string[];
  /** room_id 필터 — 해당 방의 변경만 감지 */
  roomId?: string;
  /** debounce ms (기본 400) — 짧은 시간 내 여러 이벤트는 1회 refresh */
  debounceMs?: number;
};

/**
 * 사용 예시:
 *   <RealtimeRefresh tables={["messages","votes"]} roomId={room.id} />
 *
 * 한계:
 * - RLS가 적용되므로 본인이 read 가능한 row의 변경만 수신.
 * - room_id 컬럼이 없는 테이블은 filter 없이 전체 구독 (예: stages는 room_id 있음, votes는 stage_run_id만).
 *   → 본 구현은 room_id 컬럼이 있는 테이블만 정확히 필터링. 그 외는 broad subscribe.
 */
export default function RealtimeRefresh({ tables, roomId, debounceMs = 400 }: Props) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `rt-${tables.join("-")}-${roomId ?? "any"}`;
    const channel = supabase.channel(channelName);

    const trigger = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        router.refresh();
      }, debounceMs);
    };

    for (const table of tables) {
      const filter = roomId && hasRoomIdColumn(table) ? `room_id=eq.${roomId}` : undefined;
      channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) } as never,
        trigger as never,
      );
    }

    channel.subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(","), roomId, debounceMs]);

  return null;
}

function hasRoomIdColumn(table: string): boolean {
  // 본 프로젝트 스키마 기준 — room_id를 가진 테이블 목록
  return ["rooms", "stages", "participants", "matches", "messages", "reports"].includes(table);
}
