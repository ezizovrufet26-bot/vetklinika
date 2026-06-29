'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RegisterRequestModal from '@/components/RegisterRequestModal'
import SuperAdminPanel from '@/components/SuperAdminPanel'

export default function LandingPage() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  useEffect(() => {
    // Dynamically load Lucide icons & GSAP scripts for cinematic animations
    const gsapScript = document.createElement('script')
    gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'
    gsapScript.async = true
    document.body.appendChild(gsapScript)

    const scrollScript = document.createElement('script')
    scrollScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'
    scrollScript.async = true
    document.body.appendChild(scrollScript)

    return () => {
      if (document.body.contains(gsapScript)) document.body.removeChild(gsapScript)
      if (document.body.contains(scrollScript)) document.body.removeChild(scrollScript)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#faf8f5] font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 relative overflow-x-hidden">
      
      {/* Global Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Floating Pill Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[1200px] bg-white/80 backdrop-blur-2xl border border-slate-200/80 rounded-full z-40 px-6 py-3.5 shadow-xl flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            🐾
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">Vet<span className="text-emerald-600">Klinika</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-600">
          <a href="#features" className="hover:text-emerald-600 transition-colors">İmkanlar</a>
          <a href="#clinical" className="hover:text-emerald-600 transition-colors">Klinik Alətlər</a>
          <a href="#ai" className="hover:text-emerald-600 transition-colors">AI Resepşn</a>
          <a href="#integrations" className="hover:text-emerald-600 transition-colors">İnteqrasiyalar</a>
          <a href="#contact" className="hover:text-emerald-600 transition-colors">Əlaqə</a>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hidden sm:block font-bold text-sm text-slate-700 hover:text-emerald-600 transition-colors">Sistemə Giriş</Link>
          <button 
            onClick={() => setIsRegisterOpen(true)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-full shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.03] active:scale-95"
          >
            📝 Qeydiyyatdan Keç Və Sına
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-44 pb-20 px-6 max-w-[1300px] mx-auto relative">
        {/* Playful Geometric Background Blobs */}
        <div className="absolute top-20 right-10 w-[550px] h-[550px] bg-emerald-100/70 rounded-full blur-3xl -z-10 opacity-70 animate-pulse"></div>
        <div className="absolute bottom-10 left-0 w-[450px] h-[450px] bg-amber-100/70 rounded-full blur-3xl -z-10 opacity-70"></div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200/60 rounded-full text-xs font-black text-emerald-800 uppercase tracking-wider">
              <span>✨</span> Azərbaycanda İlk AI Destəkli Baytarlıq Sistemi
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.08] tracking-tight">
              Baytarlıq klinikanız üçün <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">mükəmməl proqram</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-xl">
              VetKlinika — müayinələri sürətləndirən, süni intellektli səsli resepşn və avtomatlaşdırılmış UZİ/Qan analizator inteqrasiyası ilə gəlirinizi artıran yeni növ proqram təminatıdır.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button 
                onClick={() => setIsRegisterOpen(true)}
                className="px-8 py-4 bg-slate-900 hover:bg-emerald-600 text-white font-black text-base rounded-full shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-3"
              >
                <span>⚡</span> Pulsuz Müraciət Göndər
              </button>
              <a href="https://wa.me/994501234567" target="_blank" rel="noreferrer" className="px-8 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-base rounded-full border border-emerald-200/80 transition-all flex items-center gap-2">
                <span>💬</span> WhatsApp İlə Əlaqə
              </a>
            </div>

            {/* Social Proof Stats */}
            <div className="pt-8 border-t border-slate-200/70 grid grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-black text-slate-900">100%</p>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Avtomatik İnteqrasiya</p>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-600">3x</p>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Sürətli S.O.A.P. Qeydi</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">24/7</p>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">AI Zəng Resepşn</p>
              </div>
            </div>
          </div>

          {/* Shepherd Style Geometric Art Collage */}
          <div className="w-full lg:w-1/2 relative h-[520px] flex items-center justify-center">
            <div className="absolute inset-0 grid grid-cols-2 gap-6 p-6">
              <div className="relative overflow-hidden rounded-[3rem] border-8 border-white shadow-2xl z-20 hover:scale-105 transition-transform duration-500 aspect-square">
                <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80" alt="Həkim Müayinəsi" className="object-cover w-full h-full" />
              </div>
              <div className="bg-emerald-400 rounded-t-[3rem] rounded-br-[3rem] aspect-square relative overflow-hidden shadow-xl z-10 flex items-center justify-center p-8 hover:rotate-3 transition-transform">
                <div className="text-white text-center">
                  <span className="text-5xl font-black block mb-2">🐾</span>
                  <p className="font-bold text-sm">Xəstə Kartotekası</p>
                </div>
              </div>
              <div className="bg-amber-400 rounded-full aspect-square relative shadow-xl z-30 flex items-center justify-center hover:-rotate-6 transition-transform">
                <span className="text-6xl">🐶</span>
              </div>
              <div className="relative overflow-hidden rounded-bl-[3rem] rounded-t-[3rem] border-8 border-white shadow-2xl z-20 hover:scale-105 transition-transform duration-500 aspect-square">
                <img src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&w=800&q=80" alt="Baytar Həkim" className="object-cover w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* S.O.A.P Workflow Section (Shepherd Style) */}
      <section id="clinical" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Sizin klinik iş axınınız üçün xüsusi layihələndirilib
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              VetKlinika təkcə gözəl deyil — həkimlərin işini yüngülləşdirmək, saniyələr içində S.O.A.P. müayinə qeydlərini yazmaq üçün yaradılıb.
            </p>
          </div>

          <div className="bg-[#f2f0e9] p-8 sm:p-12 rounded-[3.5rem] shadow-xl border border-slate-200/60 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="flex gap-3">
                <span className="px-6 py-3 bg-emerald-600 text-white font-black text-base rounded-2xl shadow-md">S</span>
                <span className="px-6 py-3 bg-white text-slate-500 font-bold text-base rounded-2xl border border-slate-200">O</span>
                <span className="px-6 py-3 bg-white text-slate-500 font-bold text-base rounded-2xl border border-slate-200">A</span>
                <span className="px-6 py-3 bg-white text-slate-500 font-bold text-base rounded-2xl border border-slate-200">P</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="font-black text-slate-800 text-lg">Subyektiv (Şikayət & Simptomlar)</h4>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg">YENİ</span>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  "Heyvan sahibi 2 gündür iştahsızlıq və qusma şikayəti ilə müraciət edib..."
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <h3 className="text-3xl font-black text-slate-900">Sonsuz klikləməyə son qoyun</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Ənənəvi tibbi proqramlar həkimləri saatlarla kompüter arxasında otuzdurur. Bizim modulumuz isə 1 kliklə diaqnoz və müalicə planını sistemə işləməyə imkan verir.
              </p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 font-black text-emerald-600 hover:text-emerald-700 text-lg group">
                İdarəetmə Panelini Açın <span className="group-hover:translate-x-2 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp CTA Button */}
      <a
        href="https://wa.me/994501234567"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-8 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl shadow-emerald-500/50 flex items-center gap-3 font-bold text-sm transition-all hover:scale-110 active:scale-95 group"
      >
        <span className="text-2xl animate-bounce">💬</span>
        <span className="hidden sm:inline pr-2">WhatsApp Canlı Dəstək</span>
      </a>

      {/* Client Registration Modal */}
      <RegisterRequestModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
      />

      {/* SuperAdminVIP VIP Panel Trigger */}
      <SuperAdminPanel />

    </div>
  )
}
