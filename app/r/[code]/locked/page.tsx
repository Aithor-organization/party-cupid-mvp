// A-18 잠금 화면 — prototype/v3-06-locked.html 충실 변환
// 주최자 편집 중 표시
export default function LockedPage() {
  return (
    <div className="bg-bg min-h-screen text-slate-900 antialiased relative">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-rose-50/80 backdrop-blur-md h-16 flex justify-center items-center px-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-rose-500" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          <h1 className="text-xl font-bold text-rose-500 tracking-tight">Party Cupid</h1>
        </div>
      </header>

      {/* Main */}
      <main className="min-h-screen flex flex-col items-center px-6 pt-16 pb-32">
        <div className="h-[176px] w-full"></div>

        {/* Middle Section */}
        <section className="flex flex-col items-center text-center space-y-4 max-w-[280px]">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-primary mb-2 animate-pulse shadow-sm">
            <span className="material-symbols-outlined" style={{ fontSize: "40px" }}>construction</span>
          </div>
          <h2 className="text-[22px] font-bold text-slate-800 leading-tight">
            현재 이벤트 구성 중입니다
          </h2>
          <p className="text-[15px] text-slate-500">
            잠시만 기다려주세요
          </p>
        </section>

        {/* Information Box */}
        <section className="mt-12 w-full max-w-sm">
          <div className="bg-warning-surface p-5 rounded-lg border border-warning/10 shadow-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-warning mt-0.5" style={{ fontSize: "20px" }}>hourglass_top</span>
            <div className="space-y-1">
              <p className="text-[13px] font-bold text-amber-900">
                주최자가 단계를 조정하고 있어요
              </p>
              <p className="text-[13px] text-amber-800/80">
                곧 다음 단계로 안내해 드릴게요
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Section */}
        <section className="mt-auto pt-8">
          <p className="text-[11px] text-slate-400 font-medium">
            이 화면은 자동으로 사라집니다
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-8 left-0 w-full flex flex-col items-center gap-2 px-6 bg-transparent">
        <div className="flex gap-4">
          <a className="text-[11px] font-medium leading-tight text-rose-400 hover:text-rose-600 transition-colors" href="#">운영 정책</a>
          <a className="text-[11px] font-medium leading-tight text-rose-400 hover:text-rose-600 transition-colors" href="#">문의하기</a>
        </div>
        <p className="text-[11px] font-medium leading-tight text-rose-400">© 2026 Party Cupid. All rights reserved.</p>
      </footer>

      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-rose-200/20 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-[5%] -left-[5%] w-[30%] h-[30%] bg-rose-300/10 blur-[60px] rounded-full"></div>
      </div>
    </div>
  );
}
