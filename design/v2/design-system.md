# Design System v2 — Party Cupid

> v1 → v2 변경: 상태 토큰 추가, 컴포넌트 상태 규격 명세, 접근성 반영

## 컬러 토큰

### Base
| 토큰 | HEX | 용도 |
|------|-----|------|
| `--color-primary` | `#FF4D6D` | 하트/핵심 CTA |
| `--color-primary-hover` | `#E63956` | hover/pressed |
| `--color-primary-soft` | `#FFE3E8` | 선택됨 배경, 받은 하트 카드 |
| `--color-accent` | `#7C3AED` | 2차 투표 단계 구분 |
| `--color-accent-soft` | `#EDE4FF` | 2차 배너 배경 |
| `--color-success` | `#10B981` | 매칭 성공 |
| `--color-success-soft` | `#D4F7E8` | 성공 배경 |
| `--color-danger` | `#EF4444` | 신고/강퇴/에러 |
| `--color-danger-soft` | `#FEE2E2` | 위험 액션 배경 |
| `--color-warning` | `#F59E0B` | 경고 |
| `--color-warning-surface` | `#FEF3C7` | 경고 배너 배경 |
| `--color-bg` | `#FFF7F8` | 앱 배경 |
| `--color-surface` | `#FFFFFF` | 카드/모달 |
| `--color-text-primary` | `#1F2937` | 본문 (AAA) |
| `--color-text-secondary` | `#6B7280` | 보조 |
| `--color-text-disabled` | `#9CA3AF` | 비활성 |
| `--color-border` | `#E5E7EB` | 경계 |
| `--color-border-strong` | `#D1D5DB` | 강조 경계 |
| `--color-overlay` | `rgba(17,24,39,0.5)` | 모달 backdrop |

### State (신규)
| 토큰 | 정의 | 용도 |
|------|------|------|
| `--state-disabled-bg` | `#F3F4F6` | 비활성 표면 |
| `--state-disabled-fg` | `--color-text-disabled` | 비활성 글자 |
| `--state-focus-ring` | `2px solid --color-primary` + 2px offset | 포커스 인디케이터 |
| `--state-selected-bg` | `--color-primary-soft` | 선택됨 배경 |
| `--state-selected-border` | `2px solid --color-primary` | 선택됨 테두리 |
| `--state-pressed-scale` | `0.97` | tap 피드백 스케일 |

## 타이포그래피

| 레벨 | 크기/무게/line-height | 용도 |
|------|----------------------|------|
| `display` | 28 / 700 / 1.3 | 페이지 주 타이틀 |
| `h1` | 22 / 700 / 1.4 | 섹션 제목 |
| `h2` | 18 / 600 / 1.4 | 카드 제목 |
| `body` | 15 / 400 / 1.5 | 본문 |
| `small` | 13 / 400 / 1.4 | 보조 |
| `micro` | 11 / 500 / 1.2 | 배지/카운터 |

폰트: `-apple-system, Pretendard, "Noto Sans KR", sans-serif`

## 스페이싱

`sp-1(4)` `sp-2(8)` `sp-3(12)` `sp-4(16)` `sp-5(20)` `sp-6(24)` `sp-8(32)` `sp-12(48)`

## 컴포넌트 상태 규격 (신규)

### Button
| 상태 | primary | secondary | danger |
|------|---------|-----------|--------|
| default | bg primary / fg white | bg surface / border 1px / fg text-primary | bg danger / fg white |
| hover | bg primary-hover | bg bg | bg #DC2626 |
| pressed | scale 0.97 | same + bg #F3F4F6 | scale 0.97 |
| disabled | bg state-disabled-bg / fg state-disabled-fg / cursor not-allowed | same | same |
| focus | + ring focus | + ring focus | + ring focus |
| loading | spinner 좌측 + 텍스트 "처리 중..." / disabled interaction | - | - |

높이: sm 36px / md 44px (기본) / lg 52px
터치 타겟 최소 **44×44px** (iOS HIG)

### 하트 버튼 (신규 컴포넌트)
| 상태 | 아이콘 | 배경 | 라벨 |
|------|--------|------|------|
| `unselected` | ♡ outline | surface | "하트 보내기" |
| `selected` | ❤ filled | primary-soft | "하트 보냄 · 취소" (아이콘 탭 시 확인 바텀시트) |
| `disabled-out-of-vote` | ♡ muted | disabled-bg | "1차 투표는 20:30부터" (툴팁) |
| `disabled-no-heart` | ♡ muted | disabled-bg | "남은 하트 없음" |
| `loading` | spinner | surface | - |

터치 영역: 최소 44×44px, 리스트에서는 명확한 **별도 탭존** (카드 영역과 분리)

### Banner (투표 단계)
| 상태 | 배경 | 아이콘 | 제목 | 기간 표시 |
|------|------|--------|------|----------|
| `pre-vote-1` | bg | ⏳ | "곧 1차 투표 시작" | "20:30부터" |
| `vote-1-active` | primary-soft | 🌸 | "1차 (첫인상) 투표" | 카운트다운 `22:15` |
| `between-votes` | warning-surface | 💬 | "대화 시간" | "22:00에 2차" |
| `vote-2-active` | accent-soft | 💜 | "2차 (대화 후) 투표" | 카운트다운 |
| `post-vote` | success-soft | 💝 | "매칭 결과 공개" | CTA `[매칭 보기]` |
| `closed` | disabled-bg | 🔒 | "파티 종료" | - |

### Toast
- 위치: 상단 16px, 중앙, max-width 340px
- 자동 dismiss: 3s (성공) / 5s (경고) / 즉시 dismiss 금지 (에러는 사용자 확인)
- 역할별 배경: success / warning-surface / danger-soft
- 스크린리더: `role="status"` (성공) / `role="alert"` (에러)

### Bottom Sheet (신규)
- 용도: 하트 취소 확인, 신고 사유 선택, 차단 확인
- 핸들 바 상단 + backdrop(overlay)
- 첫 버튼 auto-focus, ESC/backdrop 탭으로 dismiss
- 애니메이션: 300ms, `prefers-reduced-motion` 시 50ms fade

### Skeleton (로딩)
- 참여자 목록: 카드 형태 × 5
- 쪽지 리스트: 라인 × 3
- 대시보드 카드: 카드 × 2
- 애니메이션: shimmer 1.5s, reduced-motion 시 정적 회색

### Empty State 규격
모든 리스트형 페이지 필수. 구조: `아이콘 + 제목(h2) + 설명(small) + 선택적 CTA`

## 접근성 체크리스트 (와이어에 반영)

- [x] 터치 타겟 ≥ 44×44px (버튼 기본 48px)
- [x] 색 대비 AA (본문 4.5:1, UI 3:1) — 텍스트는 항상 아이콘과 병행
- [x] 색에만 의존 금지: 상태별 아이콘/텍스트 라벨 병행
- [x] 아이콘 단독 버튼 `aria-label` 필수
- [x] 입력 에러: 빨간색 + 아이콘 + 텍스트 메시지 3중
- [x] 포커스 인디케이터: 2px primary ring, 명확한 가시성
- [x] `prefers-reduced-motion` 존중
- [x] 탭 순서: 논리적 (헤더 → 배너 → 리스트 → 네비)
- [x] 모달/시트: focus trap + ESC 닫기
- [x] 스크린리더: 상태 변화 aria-live 알림 (투표 단계 전환)
