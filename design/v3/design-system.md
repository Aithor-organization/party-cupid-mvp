# Design System v3 — Party Cupid

> **v2 → v3 변경**: 입력/체크박스/탭/카드/카운트다운 컴포넌트 규격 추가 + 실패 상태 + 접근성 인터랙션 규격

## 컬러 토큰

### Base
| 토큰 | HEX | 용도 |
|------|-----|------|
| `--color-primary` | `#FF4D6D` | 하트/핵심 CTA |
| `--color-primary-hover` | `#E63956` | hover/pressed |
| `--color-primary-soft` | `#FFE3E8` | 선택됨 배경 |
| `--color-accent` | `#7C3AED` | 2차 투표 구분 |
| `--color-accent-soft` | `#EDE4FF` | 2차 배너 배경 |
| `--color-success` | `#10B981` | 매칭 성공 |
| `--color-success-soft` | `#D4F7E8` | |
| `--color-danger` | `#EF4444` | 신고/강퇴/에러 |
| `--color-danger-soft` | `#FEE2E2` | |
| `--color-warning` | `#F59E0B` | 경고 |
| `--color-warning-surface` | `#FEF3C7` | |
| `--color-bg` | `#FFF7F8` | |
| `--color-surface` | `#FFFFFF` | |
| `--color-text-primary` | `#1F2937` | |
| `--color-text-secondary` | `#6B7280` | |
| `--color-text-disabled` | `#9CA3AF` | |
| `--color-border` | `#E5E7EB` | |
| `--color-border-strong` | `#D1D5DB` | |
| `--color-overlay` | `rgba(17,24,39,0.5)` | |

### State
| 토큰 | 용도 |
|------|------|
| `--state-disabled-bg` `#F3F4F6` | |
| `--state-focus-ring` `2px primary + 2px offset` | |
| `--state-selected-bg` `primary-soft` | |
| `--state-selected-border` `2px primary` | |
| `--state-pressed-scale` `0.97` | |

### Vote Status (신규)
| 토큰 | 용도 |
|------|------|
| `--vote-maintained` `#FFE3E8` + `border 2px primary` | 유지 |
| `--vote-new` `#D4F7E8` + `border 2px success` | 신규 |
| `--vote-removed` `#FEF3C7` + `border dashed warning` | 해제 예정 |

## 타이포그래피
(v2 동일 — display 28 / h1 22 / h2 18 / body 15 / small 13 / micro 11)

## 스페이싱
(v2 동일 — 4px 그리드)

---

## 컴포넌트 규격

### Button (v2 상태 규격 유지)
default / hover / pressed / disabled / focus / loading × primary / secondary / danger

### 하트 버튼 (v2)
unselected / selected / disabled-out-of-vote / disabled-no-heart / loading
+ v3: `selected-maintained` (2차에서 1차 선택 유지), `selected-new` (2차에서 신규 선택)

### Input Field (신규)
| 상태 | 스타일 | 라벨 / 헬퍼 |
|------|--------|-----------|
| default | height 48 / border 1px / radius 8 | label 상단, helper 하단 small |
| focus | border 2px primary + ring | - |
| filled | border 1px strong | ✓ 아이콘 우측 (유효 시) |
| error | border 2px danger + ⚠ 아이콘 | 에러 텍스트 danger 색 |
| disabled | bg disabled-bg / text disabled | "이 항목은 지금 변경할 수 없어요" 툴팁 |
| loading | spinner 우측 | (중복 검사 등) |

접근성: `<label>` 명시, `aria-describedby` → 헬퍼/에러 텍스트, `aria-invalid="true"` 에러 시

### Checkbox (신규)
| 상태 | 스타일 |
|------|--------|
| unchecked | 20×20 border 1px radius 4 |
| checked | bg primary / ✓ white |
| focus | + 2px ring |
| disabled | bg disabled / cursor not-allowed |

라벨: 체크박스 우측 8px, 최소 44×44px 클릭 영역. **약관 체크박스는 라벨 전체가 링크**.

### Tab (신규)
| 상태 | 스타일 |
|------|--------|
| default | text-secondary / border-bottom 2px transparent |
| active | text-primary bold / border-bottom 2px primary |
| hover | text-primary |
| disabled | text-disabled / cursor not-allowed |

숫자 배지: 이름 우측 8px, micro 폰트, danger-soft 배경(신고 미처리 등)
접근성: `role="tablist"`, 키보드 ←→ 이동, Enter/Space 활성화

### Card (신규)
| 변형 | 용도 | 스타일 |
|------|------|--------|
| `default` | 기본 카드 | surface / padding 16 / radius 12 / shadow sm |
| `selectable` | 탭 가능 | + cursor pointer + hover bg |
| `selected` | 선택됨 | bg selected / border 2px primary |
| `warning` | 경고 | bg warning-surface / border-l 4px warning |
| `danger` | 위험 | bg danger-soft / border-l 4px danger |
| `empty` | 빈 상태 | dashed border / text 중앙 정렬 |

### Countdown (신규)
```
⏱ 마감까지  00:22:15
            ↑    ↑    ↑
            시   분   초
```

| 상태 | 스타일 | 스크린리더 |
|------|--------|-----------|
| > 10분 | text-secondary / 1초 단위 업데이트 | 1분마다 알림 |
| 5~10분 | text-primary / 1초 단위 | 1분마다 |
| 1~5분 | text-warning / 1초 단위 | 30초마다 |
| 1분 미만 | text-danger bold pulse | 10초마다 + 10/5/3/2/1 카운트 |

`aria-live="polite"`로 변경 알림 (too frequent 방지)
`prefers-reduced-motion` 시 pulse 제거

### Empty State (신규 규격)
```
     [아이콘 48px]
    [제목 h2]
    [설명 small]
    [선택적 CTA button]
```

| 페이지 | 아이콘 | 제목 | 설명 | CTA |
|--------|--------|------|------|-----|
| 참여자 목록 | ✨ | "곧 시작됩니다" | "다른 분들이 입장하면 여기에 표시돼요" | - |
| 검색 결과 없음 | 🔍 | "찾을 수 없어요" | "'{키워드}'와 일치하는 참여자가 없어요" | [검색 지우기] |
| 받은 쪽지 | 💌 | "아직 쪽지가 없어요" | "누군가 먼저 보내올 거예요" | - |
| 보낸 쪽지 | 📤 | "보낸 쪽지가 없어요" | "참여자에게 먼저 말 걸어보세요" | [참여자 보기] |
| 내 하트 | ♡ | "아직 하트가 없어요" | "마음에 드는 사람에게 하트를 보내보세요" | [참여자 보기] |
| 매칭 (2차 전) | 🌸 | "결과는 2차 마감 후에" | "22:30부터 공개돼요" | - |
| 매칭 (없음) | 💝 | "이번엔 매칭이 없어요" | "쪽지로 대화를 이어가볼까요?" | [쪽지 보내기] |
| 주최자 파티 | 🎉 | "첫 방을 만들어보세요" | "몇 분이면 시작할 수 있어요" | [+ 방 만들기] |
| 신고 큐 | ✅ | "처리할 신고가 없어요" | "평온한 파티네요" | - |

### Loading Skeleton (신규 규격)

| 페이지 | 스켈레톤 구조 |
|--------|--------------|
| 참여자 목록 | 카드(아바타 원 + 텍스트 2줄 + 버튼 박스) × 5 |
| 쪽지 리스트 | 라인(아바타 + 제목 + 날짜) × 4 |
| 대시보드 | 카드(헤더 + 메트릭 3개) × 2 |
| QR 생성 | 정사각형 200×200 shimmer |

shimmer 1.5s, `prefers-reduced-motion` 시 정적 `#F3F4F6` 배경

### Error State (신규 규격 — 종류별)

| 상황 | UI 패턴 | 예시 |
|------|---------|------|
| 네트워크 오류 (페이지) | 전체 화면 카드 (icon + 제목 + [다시 시도]) | "연결이 끊겼어요" |
| 네트워크 오류 (부분) | 섹션 내부 카드 + [다시 시도] | "받은 관심을 불러오지 못했어요" |
| 전송 실패 (하트/쪽지) | 토스트 (role=alert) + [다시 시도] | "하트를 보내지 못했어요" |
| 검증 실패 (입력) | 필드 내부 ⚠ + 텍스트 | "이미 사용 중인 닉네임이에요" |
| 권한 실패 (만료/강퇴) | 전체 화면 커버 | "파티에 참여할 수 없어요" |
| 서버 오류 (500) | 전체 화면 카드 | "잠시 후 다시 시도해주세요 (5xx)" |
| QR 생성 실패 (주최자) | 카드 + [재생성] | "QR을 생성하지 못했어요" |
| 신고 제출 실패 | 바텀시트 유지 + 에러 배너 | "신고를 전송하지 못했어요" |

### Bottom Sheet (v2 유지)

### Toast (v2 유지)

---

## 접근성 인터랙션 규격 (v3 신규)

### 1. ARIA Live Region 문구 정의

| 이벤트 | live region 문구 | 시점 |
|--------|----------------|------|
| 하트 전송 성공 | "라이트님에게 하트를 보냈어요. 남은 하트 2개" | 즉시 |
| 하트 취소 | "하트를 취소했어요" | 즉시 |
| 1차 투표 시작 | "1차 투표가 시작되었습니다. 첫인상으로 하트를 보내세요" | polite |
| 1차 투표 마감 | "1차 투표가 마감되었습니다" | assertive |
| 2차 투표 시작 | "2차 투표가 시작되었습니다. 1차 선택을 유지하거나 변경할 수 있어요" | polite |
| 매칭 결과 공개 | "N명과 매칭되었습니다" | assertive |
| 쪽지 도착 | "새 쪽지가 도착했어요" | polite |

### 2. 카운트다운 스크린리더 규칙

- 분 단위 이상: 1분마다 낭독 ("마감까지 22분 남음")
- 5분 미만: 30초마다
- 1분 미만: 10초/5초/3/2/1초 남음 낭독
- 매 초 낭독 금지 (사용자 피로)

### 3. 키보드 내비게이션

| 화면 | Tab 순서 | 특수 키 |
|------|---------|---------|
| 홈 | 헤더 → 투표 카드 → 타임라인 → 현황 → 받은 관심 → 네비 | - |
| 참여자 목록 | 검색 → 카드[하트] 순차 | ↑↓ 리스트 이동 |
| 참여자 상세 | 신고 → 하트 → 쪽지 → 안전 | ESC = 뒤로 |
| 바텀시트 | 내부 첫 버튼 auto-focus, Tab trap | ESC = 닫기 |
| 모달 | 내부 auto-focus, Tab trap | ESC = 닫기 |

포커스 visible: `:focus-visible` 2px primary ring (터치는 표시 안 함)

### 4. 스크린리더 라벨 예시

- 하트 버튼 unselected: `aria-label="캔디팝님에게 하트 보내기"`
- 하트 버튼 selected: `aria-label="캔디팝님에게 보낸 하트 취소"` + `aria-pressed="true"`
- 배지 "1차 선택됨": `aria-label="1차 투표에서 선택한 참여자"`
- 카운트다운: `aria-label="마감까지 22분 15초 남음"`
- 네비 홈: `aria-label="홈으로 이동"` + `aria-current="page"` (현재)

### 5. 색에 의존하지 않는 상태 표시

모든 상태는 **색 + 아이콘/텍스트** 이중 표시:
- 선택됨: primary 배경 + ❤ 채워진 아이콘 + "선택됨" 배지
- 에러: danger 색 + ⚠ 아이콘 + 텍스트 메시지
- 유지/신규/해제: 색 + 텍스트 라벨 ("유지" "신규" "해제 예정")

### 6. Reduced Motion

`@media (prefers-reduced-motion: reduce)`:
- 바텀시트/모달 애니메이션: 50ms fade only
- 카운트다운 pulse 제거
- skeleton shimmer → 정적 회색
- Toast 슬라이드 → 즉시 표시
