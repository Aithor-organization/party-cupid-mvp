# Design System v5 — Party Cupid (Unified)

> **v4 → v5 변경**: patch 컴포넌트를 base로 통합. 모든 컴포넌트가 단일 문서에 정식 규격화.

## 컬러 토큰 (v3와 동일)

### Base
`--color-primary` `#FF4D6D` · `--color-primary-hover` `#E63956` · `--color-primary-soft` `#FFE3E8`
`--color-accent` `#7C3AED` · `--color-accent-soft` `#EDE4FF`
`--color-success` `#10B981` · `--color-success-soft` `#D4F7E8`
`--color-danger` `#EF4444` · `--color-danger-soft` `#FEE2E2`
`--color-warning` `#F59E0B` · `--color-warning-surface` `#FEF3C7`
`--color-bg` `#FFF7F8` · `--color-surface` `#FFFFFF`
`--color-text-primary` `#1F2937` · `--color-text-secondary` `#6B7280` · `--color-text-disabled` `#9CA3AF`
`--color-border` `#E5E7EB` · `--color-border-strong` `#D1D5DB`
`--color-overlay` `rgba(17,24,39,0.5)`

### State
`--state-disabled-bg` · `--state-focus-ring` 2px primary + 2px offset · `--state-selected-bg` primary-soft · `--state-selected-border` 2px primary · `--state-pressed-scale` 0.97

### Vote Status
`--vote-maintained` primary-soft + border 2px primary (유지)
`--vote-new` success-soft + border 2px success (신규)
`--vote-removed` warning-surface + border dashed 2px warning (해제 예정)
`--vote-unsaved` border-l 4px danger (저장 미완료)

## 타이포그래피
display 28/700, h1 22/700, h2 18/600, body 15/400, small 13/400, micro 11/500

## 스페이싱
4px grid · sp-1/2/3/4/5/6/8/12

---

## 컴포넌트 규격 (Unified)

### Button
default / hover / pressed / disabled / focus / loading × primary / secondary / danger
- 높이 sm 36 · md 44 (기본) · lg 52
- 터치 타겟 ≥ 44×44

### Heart Button
`unselected` · `selected` · `selected-maintained` · `selected-new` · `selected-unsaved` (저장 실패) · `disabled-out-of-vote` · `disabled-no-heart` · `loading` (saving)

시각화:
- unselected: ♡ outline
- selected: ❤ filled, primary-soft bg
- selected-maintained: ❤ + "유지" micro 배지
- selected-new: ❤ + "신규" 배지 + success-soft bg
- selected-unsaved: ❤ + ⚠ 빨간 점 + "저장 실패 · 탭 재시도"
- loading: spinner 우상단 + "저장 중..."

### Input Field
default / focus / filled / error / disabled / loading — v3와 동일

### Checkbox, Tab, Card, Countdown, Empty State, Loading Skeleton
v3 규격 그대로 유지 (변경 없음)

### Error State
네트워크 / 전송 실패 / 검증 실패 / 권한 실패 / 서버 5xx / QR 생성 실패 / 신고 제출 실패 / **하트 저장 실패** / **동시성 충돌** / **마감 직전 저장 중**

### Round Banner (v4 patch → base 통합)

`ROUND_BANNER` 컴포넌트 — 투표 단계 자동 전환:

| 상태 | 배경 | 아이콘 | 텍스트 | ARIA |
|------|------|--------|--------|------|
| `pre-vote-1` | bg | ⏳ | "곧 1차 투표 시작 · 20:30" | polite |
| `vote-1` | accent-soft | 🌸 | "1차 투표 진행 중 · 첫인상으로 선택" | polite |
| `vote-1-ending` | warning-surface | ⏰ | "1차 마감 1분 전 · 지금 선택이 최종" | **assertive** |
| `between` | bg | 💬 | "대화 시간 · 22:00에 2차 시작" | polite |
| `vote-2` | accent-soft | 💜 | "2차 투표 진행 중 · 1차 선택 유지/변경 가능" | polite |
| `vote-2-ending` | danger-soft | ⏰ | "2차 마감 1분 전 · 이번이 최종 선택" | **assertive** |
| `closed` | disabled-bg | 🔒 | "투표 종료 · 매칭 결과 확인" + [결과 보기] | assertive |

**원칙**: 클라이언트 타이머 기반 자동 prop 교체. 문구 수동 변경 금지.

### Heart Save State (v4 patch → base 통합)

`HEART_SAVE_STATE` 상태 머신:

```
idle → saving → saved (0.8s fade)
                   ↓
              [failure] → save-failed (사용자 재시도 대기)
                   ↓
              [conflict] → conflict (diff 표시 모달)
```

| 상태 | 시각화 | 텍스트 | 자동 동작 |
|------|--------|--------|----------|
| `idle` | 기본 | - | - |
| `saving` | 하트 + spinner | "저장 중..." | - |
| `saved` | 하트 + ✓ fade 0.8s | "저장됨" | 0.8s 후 idle로 |
| `save-failed` | 하트 + ⚠ 빨간 점 | "저장 실패" | 2→4→8s 자동 재시도 (3회) |
| `conflict` | 하트 + 🔄 주황 | "변경 감지" | **CONFLICT_DIFF_MODAL 표시** |
| `closing-saving` | 하트 + ⏳ | "마감 직전 저장 중" | - |

### Conflict Diff Modal (v5 신규 — Codex 지적 #2 해결)

동시성 충돌 시 자동 새로고침 **대신** 사용자에게 diff 제시:

```
┌──────────────────────────────┐
│  ⚠ 다른 기기에서 변경됐어요     │
│                                │
│  ━━ 내가 방금 한 변경 ━━        │
│  + ❤ 라이트 #02 (선택)          │
│                                │
│  ━━ 다른 기기에서의 변경 ━━     │
│  - ❤ 라이트 #02 (취소됨)        │
│                                │
│  어느 쪽을 유지할까요?           │
│                                │
│  [내 변경 사용]  [다른 기기 사용]│
│  [두 변경 모두 취소]             │
└──────────────────────────────┘
```

스크린리더: `role="alertdialog"` + 전체 diff를 구조적으로 낭독

### Unsaved Items List (v5 신규 — Codex 지적 #6)

하트 저장 실패가 여러 건일 때 `/my-hearts` 상단에 집계 표시:

```
┌─────────────────────────────────┐
│ ⚠ 저장되지 않은 변경 3건          │
│ ──────────────────────────────  │
│ • 02 라이트 (선택 시도 · 실패)     │
│   마지막 시도 22:05:12            │
│   [다시 시도]                     │
│ • 08 오렌지빛 (취소 시도 · 실패)   │
│   [다시 시도]                     │
│ • 12 달빛 (충돌)                  │
│   [내용 확인]                     │
│                                  │
│ [모두 재시도] [모두 폐기]          │
└─────────────────────────────────┘
```

우선순위: 충돌 > 실패 > 저장 중

### Focus Management (v4 patch → base 통합, 충돌 해소)

**v4에서 발견된 Patch 5 vs 6 충돌 해결** (Codex 지적 #4):

차단 후 결과 화면 포커스 규칙 **최종 확정**:
- 진입 시 autofocus: **첫 번째 "다음으로" CTA** (`[참여자 목록으로]`)
- `[차단 해제하기]`는 화면 하단의 **secondary 액션**으로만 존재 (autofocus 아님)
- 명시 이유: 차단 직후 사용자의 주 목적은 "다른 곳으로 이동"이지 "방금 내린 결정 뒤집기"가 아님

통합 포커스 규칙:

| 상황 | 포커스 대상 | 규칙 |
|------|-----------|------|
| 바텀시트 열림 | 첫 버튼 또는 첫 필드 | focus trap + ESC 복귀 |
| 바텀시트 닫힘 | **원래 트리거 버튼** | 복귀 필수 |
| 모달 열림 | 제목 또는 첫 버튼 | focus trap |
| 탭 전환 | 결과 리스트 첫 아이템 | aria-live 알림 |
| 차단 결과 화면 | `[참여자 목록으로]` | 해제 버튼 자동 포커스 X |
| 신고 제출 성공 | 바텀시트 닫기 버튼 | - |
| 하트 토글 | **버튼 유지** (이동 X) | aria-pressed 변경 |
| 투표 단계 전환 | **현재 포커스 유지** (이동 금지) | aria-live 배너 알림만 |

### Welcome Tutorial (v5 신규 — Codex 지적 #7)

처음 입장한 참여자에게 `유지/신규/해제 예정` 개념 1회 설명:

```
┌───────────────────────┐  375×812 (A-5 온보딩 강화)
│  1/4  파티 흐름을 알려드려요 │
│                            │
│   ┌──────────────────┐   │
│   │  🌸             💜   │   │
│   │  1차          2차   │   │
│   │  첫인상      대화 후 │   │
│   └──────────────────┘   │
│                            │
│   [다음] [건너뛰기]         │
└───────────────────────┘

┌───────────────────────┐  2/4 하트 규칙
│ 마음에 드는 사람에게    │
│ ❤ 하트 3개까지 보낼 수  │
│ 있어요                  │
│ (1차·2차 각각)           │
└───────────────────────┘

┌───────────────────────┐  3/4 유지/신규/해제
│ 2차에서 1차 선택을      │
│ 바꿀 수 있어요            │
│                          │
│ ✓ 유지 · ✨ 신규          │
│ 🗑 해제 예정             │
│                          │
│ [예시 카드 3개 이미지]    │
└───────────────────────┘

┌───────────────────────┐  4/4 매칭
│ 서로 하트를 보내면       │
│ 🎉 매칭!                  │
│ 2차 마감 후 공개돼요       │
│                          │
│ [시작하기]                │
└───────────────────────┘
```

로컬 스토리지: `tutorial_seen=true` 저장, 2회부터 생략 (설정에서 재보기 가능)

### Report Follow-up Policy (v5 신규 — Codex 지적 #5)

신고 제출 후 사용자 피드백:

```
┌──────────────────────────────┐
│ ✓ 신고가 접수되었어요           │
│                                │
│ 주최자가 확인 후                │
│ • 쪽지 숨김                    │
│ • 사용자 강퇴                   │
│ • 반영 안 함                    │
│ 중 하나로 처리해요               │
│                                │
│ ℹ 처리 결과는 알리지 않아요.    │
│   동일 사용자 차단을 원하면      │
│   [지금 차단하기]               │
└──────────────────────────────┘
```

- 처리 결과 비공개 (운영자 판단 보호)
- 동일 사용자 즉시 차단 경로 제공 (안전)
- 신고 접수 사실 자체는 영구 기록 (주최자 열람)

---

## 접근성 인터랙션 규격 (v3와 동일, 포커스 규칙만 위 표로 통합)

### ARIA Live Region 문구
(v3와 동일)

### 카운트다운 낭독 규칙
> 10분: 1분마다 / 5~10분: 30초마다 / 1~5분: 30초마다 / 1분 미만: 10/5/3/2/1초

### Reduced Motion
모달/시트 애니메이션 50ms fade, countdown pulse 제거, skeleton 정적, toast 즉시
