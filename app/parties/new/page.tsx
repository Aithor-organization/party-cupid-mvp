// H-2 새 방 만들기 + 단계 빌더 — prototype/v3-02-room-builder.html 충실 변환
// 폼 제출 시 createRoomAndRedirect Server Action 호출
"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createRoomAndRedirect } from "./actions";

function ErrorBanner() {
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");
  if (!formError) return null;
  return (
    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      ⚠️ {formError}
    </div>
  );
}

type Phase = {
  id: number;
  title: string;
  vote: boolean;
  maxSelections: number;
};

const initialPhases: Phase[] = [
  { id: 1, title: "환영 인사", vote: false, maxSelections: 3 },
  { id: 2, title: "첫인상 투표", vote: true, maxSelections: 5 },
  { id: 3, title: "자기소개 시간", vote: false, maxSelections: 3 },
  { id: 4, title: "마지막 투표", vote: true, maxSelections: 3 },
];

const TEMPLATES: Record<string, Phase[]> = {
  "기본 4단계": initialPhases,
  "심플 (2단계)": [
    { id: 1, title: "자기소개", vote: false, maxSelections: 3 },
    { id: 2, title: "최종 ❤", vote: true, maxSelections: 5 },
  ],
  "긴 파티 (6단계)": [
    { id: 1, title: "환영 인사", vote: false, maxSelections: 3 },
    { id: 2, title: "1차 ❤ (첫인상)", vote: true, maxSelections: 5 },
    { id: 3, title: "자기소개 라운드", vote: false, maxSelections: 3 },
    { id: 4, title: "2차 ❤ (대화 후)", vote: true, maxSelections: 4 },
    { id: 5, title: "그룹 게임", vote: false, maxSelections: 3 },
    { id: 6, title: "최종 ❤", vote: true, maxSelections: 3 },
  ],
};

export default function NewPartyPage() {
  const [phases, setPhases] = useState<Phase[]>(initialPhases);
  const [security, setSecurity] = useState<"token" | "approval">("token");
  const [showTemplates, setShowTemplates] = useState(false);

  const togglePhaseVote = (id: number) =>
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, vote: !p.vote } : p)));

  const updatePhaseTitle = (id: number, title: string) =>
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));

  const updatePhaseMax = (id: number, maxSelections: number) =>
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, maxSelections } : p)));

  const addPhase = () => {
    setPhases((prev) => {
      const nextId = prev.length === 0 ? 1 : Math.max(...prev.map((p) => p.id)) + 1;
      return [...prev, { id: nextId, title: `새 단계 ${prev.length + 1}`, vote: false, maxSelections: 3 }];
    });
  };

  const deletePhase = (id: number) => {
    setPhases((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)));
  };

  const movePhase = (id: number, direction: "up" | "down") => {
    setPhases((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const applyTemplate = (key: string) => {
    setPhases(TEMPLATES[key].map((p, i) => ({ ...p, id: i + 1 })));
    setShowTemplates(false);
  };

  // hidden input에 phases JSON 직렬화 (Server Action으로 전송)
  const stagesJson = JSON.stringify(
    phases.map((p) => ({
      name: p.title,
      collect_vote: p.vote,
      max_selections: p.maxSelections,
    })),
  );

  return (
    <div className="bg-bg text-slate-900 min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-bg/90 text-slate-900 font-sans border-b border-rose-100 shadow-sm backdrop-blur-md">
        <div className="flex justify-between items-center h-16 px-8 max-w-full mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-all duration-200 active:scale-95">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-semibold">Back to Dashboard</span>
            </Link>
            <div className="h-4 w-[1px] bg-rose-100 mx-2"></div>
            <h1 className="text-2xl font-black text-primary tracking-tight">Party Cupid</h1>
          </div>
          <nav className="hidden md:flex gap-8">
            <Link href="/dashboard" className="text-slate-500 hover:text-primary transition-all">Rooms</Link>
            <span className="text-primary font-bold border-b-2 border-primary pb-1">Create Room</span>
            <a href="#" className="text-slate-500 hover:text-primary transition-all">Analytics</a>
          </nav>
        </div>
      </header>

      <form action={createRoomAndRedirect} className="pt-24 pb-32 max-w-4xl mx-auto px-6 block">
        {/* Subheader */}
        <div className="mb-8">
          <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">새 방 만들기</h2>
          <p className="text-slate-500 mt-1">따뜻한 인연이 시작되는 공간을 설정해주세요.</p>
        </div>

        <Suspense fallback={null}>
          <ErrorBanner />
        </Suspense>

        <div className="space-y-6">
          {/* Section 1: Basic Info */}
          <section className="bg-white rounded-lg p-8 shadow-sm border border-rose-50">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="room-name">파티 이름</label>
                <input id="room-name" name="name" required maxLength={100} className="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary px-4 py-3 bg-slate-50/50 outline-none" placeholder="예: 강남 금요 와인 파티" type="text" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="max-participants">최대 참가 인원</label>
                <input id="max-participants" name="max_participants" required min={2} max={200} className="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary px-4 py-3 bg-slate-50/50 outline-none" type="number" defaultValue={50} />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-3">
                <label className="text-sm font-semibold text-slate-700">입장 보안 모드</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${security === "token" ? "border-primary bg-primary-soft/30" : "border-slate-100 hover:border-rose-200"}`}>
                    <input type="radio" name="security" checked={security === "token"} onChange={() => setSecurity("token")} className="mt-1 text-primary focus:ring-primary" />
                    <div>
                      <span className="block font-bold text-slate-900">Time Token (자동, 권장)</span>
                      <span className="text-xs text-slate-500 mt-1">입장 코드가 주기적으로 갱신되어 안전합니다.</span>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${security === "approval" ? "border-primary bg-primary-soft/30" : "border-slate-100 hover:border-rose-200"}`}>
                    <input type="radio" name="security" checked={security === "approval"} onChange={() => setSecurity("approval")} className="mt-1 text-primary focus:ring-primary" />
                    <div>
                      <span className="block font-bold text-slate-900">Organizer Approval (수동)</span>
                      <span className="text-xs text-slate-500 mt-1">호스트가 한 명씩 승인해야 입장 가능합니다.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Phase Builder — 인터랙티브 */}
          <section className="bg-white rounded-lg shadow-sm border border-rose-50 overflow-hidden">
            {/* hidden input — Server Action으로 phases JSON 전송 */}
            <input type="hidden" name="stages_json" value={stagesJson} />

            <div className="bg-primary-soft px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>📋</span> 단계 빌더 ({phases.length}단계)
              </h3>
              <div className="flex gap-2 relative">
                <button
                  type="button"
                  onClick={() => setShowTemplates((v) => !v)}
                  className="bg-white text-slate-600 px-4 py-2 rounded-full text-sm font-bold border border-rose-100 hover:bg-rose-50 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">library_books</span>
                  템플릿
                </button>
                {showTemplates && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-rose-100 rounded-lg shadow-lg z-10 min-w-[200px]">
                    {Object.keys(TEMPLATES).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyTemplate(key)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 first:rounded-t-lg last:rounded-b-lg border-b border-rose-50 last:border-b-0"
                      >
                        {key} ({TEMPLATES[key].length}단계)
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={addPhase}
                  disabled={phases.length >= 20}
                  className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-md shadow-rose-200 hover:opacity-90 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  단계 추가
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {phases.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 bg-white border-l-4 p-4 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
                    p.vote ? "border-primary" : "border-slate-300"
                  }`}
                >
                  {/* 순서 + 위/아래 이동 */}
                  <div className="flex flex-col items-center gap-0.5 w-10">
                    <button
                      type="button"
                      onClick={() => movePhase(p.id, "up")}
                      disabled={idx === 0}
                      className="w-6 h-4 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-soft rounded text-xs disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <span className={`text-xs font-bold ${p.vote ? "text-primary" : "text-slate-400"}`}>
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => movePhase(p.id, "down")}
                      disabled={idx === phases.length - 1}
                      className="w-6 h-4 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-soft rounded text-xs disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>

                  {/* 이름 입력 */}
                  <input
                    type="text"
                    value={p.title}
                    onChange={(e) => updatePhaseTitle(p.id, e.target.value)}
                    maxLength={100}
                    placeholder="단계 이름"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-slate-50/50"
                  />

                  {/* Vote 토글 */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-[10px] font-bold mb-1 uppercase tracking-tighter ${
                        p.vote ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      ❤
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePhaseVote(p.id)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        p.vote ? "bg-primary" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`absolute top-1 bg-white w-3 h-3 rounded-full transition-all ${
                          p.vote ? "right-1" : "left-1"
                        }`}
                      ></div>
                    </button>
                  </div>

                  {/* 한도 입력 (vote=true 일 때만 활성) */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      MAX
                    </span>
                    <input
                      type="number"
                      value={p.maxSelections}
                      onChange={(e) =>
                        updatePhaseMax(p.id, Math.max(1, Math.min(10, Number(e.target.value) || 1)))
                      }
                      disabled={!p.vote}
                      min={1}
                      max={10}
                      className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center disabled:bg-slate-50 disabled:text-slate-400 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* 삭제 */}
                  <button
                    type="button"
                    onClick={() => deletePhase(p.id)}
                    disabled={phases.length <= 1}
                    className="p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title={phases.length <= 1 ? "최소 1단계 필요" : "삭제"}
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              ))}

              {phases.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  단계가 없습니다. "단계 추가" 또는 "템플릿"을 사용하세요.
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Validation Guide */}
          <section className="bg-warning-surface border border-amber-200 p-5 rounded-lg flex items-start gap-4">
            <span className="material-symbols-outlined text-warning mt-0.5">lightbulb</span>
            <div className="space-y-2">
              <p className="text-sm font-bold text-amber-900">검토가 필요합니다</p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-success text-[16px]">check_circle</span>
                  호감도 투표 단계 {phases.filter((p) => p.vote).length}개 설정됨
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-warning text-[16px]">info</span>
                  마지막 호감도 단계가 매칭 기준이 됩니다.
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer (form 내부에 두어 submit 버튼이 폼과 연결되도록) */}
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t-2 border-primary-soft shadow-[0_-4px_12px_rgba(255,77,109,0.08)]">
          <div className="flex justify-end items-center gap-4 h-24 px-12 w-full">
            <Link href="/dashboard" className="text-slate-400 px-6 py-3 rounded-full hover:text-slate-600 uppercase text-sm font-semibold tracking-wider transition-all hover:opacity-90 hover:-translate-y-0.5">
              Cancel
            </Link>
            <button type="submit" className="bg-primary text-white px-10 py-4 rounded-full shadow-lg shadow-rose-200 uppercase text-sm font-black tracking-wider transition-all hover:opacity-90 hover:-translate-y-0.5 flex items-center gap-2">
              Create Room <span className="material-symbols-outlined">done_all</span>
            </button>
          </div>
        </div>
      </form>

      {/* Decorative Elements */}
      <div className="fixed top-20 right-[-100px] w-80 h-80 bg-primary-soft opacity-20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 left-[-100px] w-64 h-64 bg-accent-soft opacity-20 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
}
