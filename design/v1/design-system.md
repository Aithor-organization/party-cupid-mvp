# Design System v1 — Party Cupid

## 컬러 토큰

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--color-primary` | `#FF4D6D` | 하트/CTA (큐피드 상징) |
| `--color-primary-hover` | `#E63956` | hover/pressed |
| `--color-accent` | `#7C3AED` | 2차 투표 배너 (구분) |
| `--color-success` | `#10B981` | 매칭 성공 |
| `--color-danger` | `#EF4444` | 신고/강퇴/에러 |
| `--color-bg` | `#FFF7F8` | 앱 배경 (따뜻한 오프화이트) |
| `--color-surface` | `#FFFFFF` | 카드/모달 |
| `--color-text-primary` | `#1F2937` | 본문 |
| `--color-text-secondary` | `#6B7280` | 보조 텍스트 |
| `--color-border` | `#E5E7EB` | 경계선 |

## 타이포그래피

| 레벨 | 크기/무게 | 용도 |
|------|----------|------|
| `display` | 28px / 700 | 페이지 주 타이틀 |
| `h1` | 22px / 700 | 섹션 제목 |
| `h2` | 18px / 600 | 카드 제목 |
| `body` | 15px / 400 | 본문 |
| `small` | 13px / 400 | 보조 |
| `micro` | 11px / 500 | 배지/카운터 |

폰트: 시스템 폰트 우선 (`-apple-system, Pretendard, "Noto Sans KR"`)

## 스페이싱

4px 그리드 기반. 토큰: `sp-1(4)` `sp-2(8)` `sp-3(12)` `sp-4(16)` `sp-5(20)` `sp-6(24)` `sp-8(32)` `sp-12(48)`

## 컴포넌트 규격

- **터치 타겟**: 최소 44×44px (iOS HIG), 버튼 48px
- **카드**: 16px padding, 12px radius, subtle shadow `0 1px 2px rgba(0,0,0,0.06)`
- **입력 필드**: height 48px, 1px border, focus ring primary 2px
- **토스트**: 상단 16px 띄우고 중앙 정렬, 자동 3초 후 dismiss
- **배지**: 18px 원형, micro 폰트, primary 배경

## 접근성 기준

- 색 대비 WCAG AA (4.5:1 본문, 3:1 UI)
- 모든 아이콘 버튼 `aria-label`
- 포커스 인디케이터 명확
- `prefers-reduced-motion` 존중
