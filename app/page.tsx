// PUB-1 랜딩 페이지 — prototype/v3-00-landing.html과 동일 디자인 (React 변환)
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="text-slate-900 overflow-x-hidden">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-rose-100">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            <span className="text-xl font-bold text-rose-500 tracking-tight">Party Cupid</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-sans text-sm font-medium">
            <a className="text-rose-500 border-b-2 border-rose-500 pb-1" href="#features">기능</a>
            <a className="text-slate-600 hover:text-rose-500 transition-colors duration-200" href="#how-it-works">사용방법</a>
            <a className="text-slate-600 hover:text-rose-500 transition-colors duration-200" href="#testimonials">후기</a>
            <a className="text-slate-600 hover:text-rose-500 transition-colors duration-200" href="#pricing">요금</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="font-sans text-sm font-medium text-slate-600 hover:text-rose-500 px-4 py-2">Login</Link>
            <Link href="/signup" className="bg-rose-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-rose-200 active:opacity-80 transition-opacity">무료로 시작하기</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 min-h-[819px] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-soft text-primary rounded-full text-sm font-semibold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              이미 1,200+ 파티에서 사용 중
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.2] text-slate-900 tracking-tight">
              파티에서 설레는 만남을,<br />
              <span className="text-primary">큐피드처럼</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              QR 한번 스캔으로 익명 호감도 투표부터 매칭까지. 주최자가 자유롭게 단계를 설계하는 파티 인터랙션 플랫폼입니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/signup" className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-rose-200 hover:scale-105 transition-transform">
                무료로 방 만들기 <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <a href="#features" className="bg-white border-2 border-slate-100 text-slate-700 px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                샘플 둘러보기
              </a>
            </div>
            <div className="flex items-center gap-4 pt-6">
              <div className="flex text-yellow-400">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0.5" }}>star_half</span>
              </div>
              <span className="font-bold text-slate-900">4.8/5</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 font-medium">사용자 만족도 1위</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-rose-100 to-purple-100 rounded-full blur-3xl opacity-60"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Party Interaction App"
              className="w-full max-w-md mx-auto rounded-[3rem] shadow-2xl border-[12px] border-white"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVDhzCUg3-LqM1PwHnPj3FaaNGJoTeBRro3PzyLrYfpoq7ntG9RvdWyQCdNCY1ZCi0bKYPDOnWPj8mFVld_flVnwNf7xEDlXESz9FoMi1DIckTAVMyUN9BQl6u78-Mov_UP2PieLXJSaVHJnTY7JNEvWnK45LZ1PDsuzbVQaCQEvVMBlN5ZAMBdtAK0c0qKSqY6G3vGoR9F6OeMQXCh_xxKS49P-5Tx7t6Cw_izph8daJNetwi0R2Afq8z62wQ1z5GtNyRhiGO6XU"
            />
            <div className="absolute top-1/4 -left-8 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
              <div className="w-10 h-10 bg-success-soft text-success rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Matching Success!</p>
                <p className="text-sm font-bold">새로운 매칭 7건 발생</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900">단 3단계로 시작하세요</h2>
            <p className="text-slate-500 max-w-md mx-auto">복잡한 설정 없이, 누구나 바로 시작할 수 있습니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-rose-100"></div>
            <div className="relative z-10 text-center space-y-4">
              <div className="w-20 h-20 bg-accent-soft text-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-50">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              </div>
              <div className="space-y-2">
                <p className="text-accent font-bold text-sm">STEP 1</p>
                <h3 className="text-xl font-bold">방 만들기</h3>
                <p className="text-slate-500 text-sm">파티의 테마와 투표 단계를<br />자유롭게 설정하세요.</p>
              </div>
            </div>
            <div className="relative z-10 text-center space-y-4">
              <div className="w-20 h-20 bg-primary-soft text-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-50">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
              </div>
              <div className="space-y-2">
                <p className="text-primary font-bold text-sm">STEP 2</p>
                <h3 className="text-xl font-bold">QR 공유</h3>
                <p className="text-slate-500 text-sm">참가자들에게 전용 QR을<br />공유하여 입장시킵니다.</p>
              </div>
            </div>
            <div className="relative z-10 text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              </div>
              <div className="space-y-2">
                <p className="text-primary font-bold text-sm">STEP 3</p>
                <h3 className="text-xl font-bold">큐피드 매칭</h3>
                <p className="text-slate-500 text-sm">자동화된 시스템으로<br />서로의 호감을 확인하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Key Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-900">왜 Party Cupid인가요?</h2>
              <p className="text-slate-500 max-w-lg">단순한 매칭을 넘어, 파티의 즐거움을 극대화하는 강력한 도구를 제공합니다.</p>
            </div>
            <div className="text-primary font-bold flex items-center gap-2 cursor-pointer group">
              모든 기능 살펴보기 <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_right_alt</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg card-hover shadow-sm border border-slate-100 flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">architecture</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">자유로운 단계 설계</h3>
                <p className="text-slate-500 leading-relaxed">파티의 성격에 따라 1차 투표, 2차 투표, 최종 선택 등 단계를 마음대로 구성하고 시간을 예약할 수 있습니다.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg card-hover shadow-sm border border-slate-100 flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">완전 익명 호감도</h3>
                <p className="text-slate-500 leading-relaxed">프라이버시를 최우선으로 합니다. 닉네임과 최소한의 정보로 안심하고 서로의 마음을 확인할 수 있습니다.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg card-hover shadow-sm border border-slate-100 flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">monitoring</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">라이브 운영 도구</h3>
                <p className="text-slate-500 leading-relaxed">실시간 입장 현황과 투표 통계를 대시보드로 확인하세요. 파티 중간에 공지 사항을 보내는 것도 가능합니다.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg card-hover shadow-sm border border-slate-100 flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">shield</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">안전한 데이터</h3>
                <p className="text-slate-500 leading-relaxed">파티가 종료되면 민감한 데이터는 자동으로 파기됩니다. 주최자와 참가자 모두 안심하고 즐기세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases (Bento Style) */}
      <section className="py-24 px-6 bg-rose-50/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900">이런 자리에 어울려요</h2>
            <p className="text-slate-500">어떤 모임이든 큐피드가 마법을 더해드립니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { alt: "Birthday Party", title: "생일 파티", desc: "지인들과의 특별한 날, 깜짝 호감도 이벤트를 열어보세요.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAn2J4B_wKNf3r3-zofDHiHIS7NyvSTQX-3wTvg9Pnm3GhAwEhW5aQZTib3pxwCudJcd2kXL8i1rFWhnT2eoJbWYKDeWF_41kuPMI1ztTysh5k7FMzTXhvpdZTO7onNHmUagQGadO2QoMixaq_G3EP5R3nBmP0BIfy-ER4IfQaa3YEc46NFbLY4Jc8LCXi_ulHz5qHersxyUCzg76HyfJRcUqHGhBlY8QKhIDiiDrFyr14z9H8yhG9w4jmQ8x9idpvQLWUdyew9zSg" },
              { alt: "Networking Session", title: "네트워킹 모임", desc: "딱딱한 분위기 대신, 재미있는 상호작용으로 자연스럽게 친해집니다.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5Iu68980GLDnIyvde44M7TABgNpVkVsjcQ85kiOW27uDixbfqK7N1adtL2nbMCJIdJnVs3Ou53zCPqIv0EDlDNRLQjirvMhAgmx0GVjQ62s05aygrqgKbOnHKizRaMpEJOBkGW8RNaxVz2gsaN7fXILuT9Z5jiaieQraRqP6T6xorWS40DcCmzNVtGu7I0ngSIGmW_XgqYAsrZtVvrs5mshRoYJEmlaVGTvLJuBoDqYuy9X_j9ICUlLIbCthk5YPhiXIVfwjjazE" },
              { alt: "Blind Date Party", title: "소개팅 파티", desc: "어색한 첫 만남을 부드럽게. 큐피드가 두근거리는 매칭을 돕습니다.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_t2FIafV9OswaQ07NjYeTC2qxTMvX0ByFZb4M9nuozbjZDZbWkWQ_VpXvG1Fhf0dzpSjgmHZ27CJ0JMfIew9sv-rzav7FdVxxMOyNlfFvxHmOamDNYlbvLOFs4ELDt8rkIXGejCR_DuHu-pd0sBNUCLIZRYUC6IaDUFFql6iGEVx9CokmcJ-3_S3fYjpmC_Zm3Xm-vZGQkbqVJXerS5ddX6Dfpfvic3wBlD7odu6GKwrp37qKTSFBE6b72-jOTi7kvP2wddVTF5w" },
            ].map((u) => (
              <div key={u.title} className="bg-white rounded-lg overflow-hidden card-hover shadow-sm group">
                <div className="h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={u.alt} className="w-full h-full object-cover transition-transform group-hover:scale-110" src={u.src} />
                </div>
                <div className="p-6 space-y-2">
                  <h4 className="text-lg font-bold">{u.title}</h4>
                  <p className="text-sm text-slate-500">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-16">주최자들의 이야기</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: '"동아리 MT에서 사용했는데 분위기가 확 살아났어요. 투표 결과가 나올 때마다 다들 난리가 났죠. 다음 행사 때도 무조건 쓸 거예요!"', name: "김지은", role: "대학 연합 동아리 회장", initial: "김" },
              { quote: '"직장인 네트워킹 파티를 매달 주최하는데, 큐피드 덕분에 운영이 200% 편해졌습니다. 매칭 성공률도 눈에 띄게 높아졌어요."', name: "박민수", role: "커뮤니티 매니저", initial: "박" },
              { quote: '"처음에는 익명이라 걱정했는데 오히려 참가자들이 더 솔직하게 참여하더라고요. 주최자로서 강력 추천하는 툴입니다."', name: "이수진", role: "이벤트 기획자", initial: "이" },
            ].map((t) => (
              <div key={t.name} className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm space-y-6">
                <div className="flex text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                </div>
                <p className="text-slate-600 leading-relaxed italic">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-primary font-bold">{t.initial}</div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900">합리적인 요금제</h2>
            <p className="text-slate-500">파티의 규모에 맞춰 가장 적합한 플랜을 선택하세요.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-10 rounded-lg border border-slate-200 flex flex-col items-center text-center space-y-6">
              <h4 className="text-lg font-bold">Free</h4>
              <div className="text-4xl font-extrabold">0<span className="text-lg font-normal text-slate-400">원</span></div>
              <ul className="text-sm text-slate-500 space-y-3">
                <li>참가자 최대 10명</li>
                <li>단일 투표 단계</li>
                <li>실시간 대시보드</li>
              </ul>
              <Link href="/signup" className="w-full py-3 rounded-full border-2 border-rose-500 text-rose-500 font-bold hover:bg-rose-50 transition-colors text-center">지금 시작하기</Link>
            </div>
            <div className="bg-white p-10 rounded-lg border-2 border-rose-500 shadow-xl relative flex flex-col items-center text-center space-y-6 overflow-hidden">
              <div className="absolute top-0 right-0 bg-rose-500 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">Recommend</div>
              <h4 className="text-lg font-bold">Pro</h4>
              <div className="text-4xl font-extrabold">9,900<span className="text-lg font-normal text-slate-400">원</span></div>
              <ul className="text-sm text-slate-500 space-y-3">
                <li>참가자 최대 100명</li>
                <li>다단계 투표 시스템</li>
                <li>커스텀 배경 이미지</li>
                <li>데이터 엑셀 다운로드</li>
              </ul>
              <Link href="/signup" className="w-full py-3 rounded-full bg-rose-500 text-white font-bold shadow-lg shadow-rose-200 active:opacity-80 transition-opacity text-center">지금 시작하기</Link>
            </div>
            <div className="bg-white p-10 rounded-lg border border-slate-200 flex flex-col items-center text-center space-y-6">
              <h4 className="text-lg font-bold">Enterprise</h4>
              <div className="text-2xl font-extrabold">별도 문의</div>
              <ul className="text-sm text-slate-500 space-y-3">
                <li>참가자 무제한</li>
                <li>전담 매니저 배정</li>
                <li>API 연동 지원</li>
                <li>맞춤형 브랜딩</li>
              </ul>
              <a href="mailto:hello@partycupid.io" className="w-full py-3 rounded-full border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-colors text-center">문의하기</a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-primary rounded-xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-4xl font-extrabold">지금 바로 첫 파티를 만들어보세요</h2>
            <p className="text-rose-100 text-lg">신용카드 없이 무료 시작 · 30초 가입</p>
            <Link href="/signup" className="bg-white text-primary px-10 py-5 rounded-full font-bold text-xl flex items-center justify-center gap-2 mx-auto hover:scale-105 transition-transform shadow-xl w-fit">
              무료로 시작하기 <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-rose-50 border-t border-rose-100 w-full py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <div className="text-lg font-bold text-rose-600">Party Cupid</div>
            <p className="font-sans text-sm text-slate-500">파티의 즐거움을 큐피드와 함께 완성하세요.</p>
          </div>
          <div>
            <h5 className="font-bold mb-4">서비스</h5>
            <ul className="font-sans text-sm text-slate-500 space-y-2">
              <li><a className="hover:underline hover:text-rose-600" href="#features">주요 기능</a></li>
              <li><a className="hover:underline hover:text-rose-600" href="#how-it-works">이용 가이드</a></li>
              <li><a className="hover:underline hover:text-rose-600" href="#testimonials">성공 사례</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4">고객지원</h5>
            <ul className="font-sans text-sm text-slate-500 space-y-2">
              <li><a className="hover:underline hover:text-rose-600" href="#">자주 묻는 질문</a></li>
              <li><a className="hover:underline hover:text-rose-600" href="mailto:hello@partycupid.io">1:1 문의</a></li>
              <li><a className="hover:underline hover:text-rose-600" href="mailto:hello@partycupid.io">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4">법적 고지</h5>
            <ul className="font-sans text-sm text-slate-500 space-y-2">
              <li><a className="hover:underline hover:text-rose-600" href="#">Privacy Policy</a></li>
              <li><a className="hover:underline hover:text-rose-600" href="#">Terms of Service</a></li>
              <li><a className="hover:underline hover:text-rose-600" href="#">About</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-rose-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-sm text-slate-500">© 2026 Party Cupid. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-rose-500">share</span>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-rose-500">camera</span>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-rose-500">mail</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
