'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Stethoscope, Bot, MessageCircle, CalendarDays, Microscope, Package,
  Wallet, ArrowRight, Check, Sparkles, Mic, HeartPulse, ShieldCheck,
  Zap, PawPrint, Clock,
} from 'lucide-react'
import RegisterRequestModal from '@/components/RegisterRequestModal'
import SuperAdminPanel from '@/components/SuperAdminPanel'
import ThemeToggle from '@/components/ui/theme-toggle'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { FadeUp } from '@/components/ui/motion'

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Səsli Resepşn',
    desc: 'WhatsApp-dan gələn səsli və yazılı müraciətləri AI dinləyir, randevu təklifi hazırlayır — həkim yalnız bir kliklə təsdiqləyir.',
    tag: '24/7 aktiv',
  },
  {
    icon: Mic,
    title: 'AI Scribe — Səsdən S.O.A.P. Qeydi',
    desc: 'Müayinə zamanı danışın, sistem avtomatik strukturlaşdırılmış müayinə qeydi yaratsın. Kompüter arxasında keçən saatlara son.',
    tag: '3x sürətli',
  },
  {
    icon: MessageCircle,
    title: 'Avtomatik WhatsApp Xatırlatmaları',
    desc: 'Peyvənd vaxtı çatan hər pasiyentin sahibinə avtomatik mesaj gedir. Unudulan peyvənd = itirilmiş gəlir. Artıq yox.',
    tag: 'Gəlir artımı',
  },
  {
    icon: Microscope,
    title: 'Cihaz İnteqrasiyası',
    desc: 'UZİ, rentgen və qan analizatorlarından (Mindray, IDEXX, Zoetis) nəticələr birbaşa pasiyent kartına düşür.',
    tag: 'Sıfır köçürmə',
  },
  {
    icon: CalendarDays,
    title: 'Ağıllı Təqvim + Canlı Lövhə',
    desc: 'Drag-and-drop pasiyent axını: gözləmə zalı → müayinə → stasionar → evə buraxılış. Bütün komanda eyni ekranı görür.',
    tag: 'Real-vaxt',
  },
  {
    icon: Package,
    title: 'Anbar və Maliyyə Nəzarəti',
    desc: 'Kritik dərman bitməmişdən xəbərdarlıq, avtomatik faktura və PDF qəbz, günlük gəlir hesabatı — hamısı bir yerdə.',
    tag: 'Stok alarmı',
  },
]

const PLANS = [
  {
    name: 'Başlanğıc',
    price: '49',
    desc: 'Tək həkimli kiçik klinikalar üçün',
    features: ['Limitsiz pasiyent kartotekası', 'Təqvim və randevu sistemi', 'Faktura və PDF qəbzlər', 'Anbar idarəetməsi'],
    cta: 'Pulsuz Sına',
    featured: false,
  },
  {
    name: 'Professional',
    price: '99',
    desc: 'Böyüyən klinikalar üçün ideal seçim',
    features: ['Başlanğıcdakı hər şey', 'AI Səsli Resepşn (24/7)', 'WhatsApp avtomatlaşdırması', 'Lab cihaz inteqrasiyası', 'Canlı Kanban lövhəsi'],
    cta: 'İndi Başla',
    featured: true,
  },
  {
    name: 'Klinika Şəbəkəsi',
    price: '249',
    desc: 'Çoxfilial və 24 saatlıq klinikalar',
    features: ['Professional-dakı hər şey', 'Limitsiz filial və istifadəçi', 'AI Scribe (səsdən qeyd)', 'Prioritet dəstək', 'Fərdi inteqrasiyalar'],
    cta: 'Bizimlə Danış',
    featured: false,
  },
]

export default function LandingPage() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 relative overflow-x-hidden">

      {/* ============ NAVBAR ============ */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[94%] max-w-[1200px] glass-panel rounded-2xl z-40 px-4 sm:px-6 py-3 shadow-premium flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-glow">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-xl font-display font-extrabold tracking-tight">
            Vet<span className="text-primary">Klinika</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7 font-bold text-sm text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">İmkanlar</a>
          <a href="#ai" className="hover:text-primary transition-colors">AI Resepşn</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Qiymətlər</a>
          <Link href="/klinikalar" className="hover:text-primary transition-colors">Klinikalar</Link>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle className="h-10 w-10" />
          <Link href="/login" className="hidden sm:block font-bold text-sm text-muted-foreground hover:text-primary transition-colors px-2">
            Sistemə Giriş
          </Link>
          <Button size="sm" onClick={() => setIsRegisterOpen(true)}>
            Pulsuz Sına
          </Button>
        </div>
      </motion.nav>

      {/* ============ HERO ============ */}
      <section className="relative pt-36 sm:pt-44 pb-24 px-6 bg-aurora">
        <div className="absolute inset-0 bg-grid -z-10" />

        <div className="max-w-[1200px] mx-auto text-center">
          <FadeUp index={0}>
            <Badge tone="primary" className="mb-6 py-1.5 px-4 text-xs normal-case tracking-normal">
              <Sparkles className="w-3.5 h-3.5" /> Azərbaycanda ilk AI dəstəkli baytarlıq platforması
            </Badge>
          </FadeUp>

          <FadeUp index={1}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.05] tracking-tight max-w-4xl mx-auto">
              Klinikanız yatanda belə <span className="text-gradient">işləyən sistem</span>
            </h1>
          </FadeUp>

          <FadeUp index={2}>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              AI səsli resepşn müştəriləri qarşılayır, WhatsApp xatırlatmaları peyvəndləri unutdurmur,
              lab cihazları nəticələri özü yazır. Siz yalnız müalicəyə fokuslanın.
            </p>
          </FadeUp>

          <FadeUp index={3}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" onClick={() => setIsRegisterOpen(true)}>
                <Zap className="w-4.5 h-4.5" /> 14 Gün Pulsuz Başla
              </Button>
              <a href="#ai">
                <Button size="lg" variant="glass">
                  AI Resepşni Gör <ArrowRight className="w-4.5 h-4.5" />
                </Button>
              </a>
            </div>
            <p className="mt-4 text-xs font-semibold text-muted-foreground">
              Kredit kartı tələb olunmur · 5 dəqiqəyə quraşdırılır
            </p>
          </FadeUp>

          {/* Dashboard Preview Mockup */}
          <FadeUp index={4} className="mt-16">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute -inset-6 bg-gradient-to-r from-primary/15 via-accent/10 to-info/15 blur-3xl rounded-full -z-10" />
              <div className="glass-panel rounded-3xl shadow-premium p-3 sm:p-4 animate-float-slow">
                <div className="bg-card rounded-2xl border border-border overflow-hidden text-left">
                  {/* Mock topbar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <span className="w-3 h-3 rounded-full bg-destructive/60" />
                    <span className="w-3 h-3 rounded-full bg-warning/60" />
                    <span className="w-3 h-3 rounded-full bg-success/60" />
                    <span className="ml-3 text-xs font-bold text-muted-foreground">vetklinika.az/dashboard</span>
                  </div>
                  {/* Mock content */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                    {[
                      { label: 'Bugünkü Gəlir', value: '1,240 ₼', icon: Wallet, tone: 'text-primary bg-primary-soft' },
                      { label: 'Klinikada', value: '7 pasiyent', icon: HeartPulse, tone: 'text-info bg-info/10' },
                      { label: 'Randevular', value: '12 seans', icon: CalendarDays, tone: 'text-success bg-success/10' },
                      { label: 'AI Sorğular', value: '3 yeni', icon: Bot, tone: 'text-warning bg-warning/10' },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl border border-border p-3.5 bg-background/50">
                        <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center mb-2 ${s.tone}`}>
                          <s.icon className="w-4 h-4" />
                        </span>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                        <p className="text-lg font-display font-extrabold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-3 px-4 pb-4">
                    {['Gözləmə', 'Müayinə', 'Stasionar', 'Buraxılış'].map((col, i) => (
                      <div key={col} className="rounded-xl bg-secondary/60 border border-border p-2.5">
                        <p className="text-[10px] font-extrabold text-muted-foreground mb-2">{col}</p>
                        {Array.from({ length: 3 - i > 0 ? (i === 1 ? 2 : 1) : 1 }).map((_, j) => (
                          <div key={j} className="rounded-lg bg-card border border-border p-2 mb-1.5 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-primary-soft text-primary flex items-center justify-center">
                              <PawPrint className="w-3 h-3" />
                            </span>
                            <span className="h-2 w-12 rounded bg-muted" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Social proof */}
          <FadeUp index={5}>
            <div className="mt-14 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              {[
                { v: '3x', l: 'Sürətli müayinə qeydi' },
                { v: '24/7', l: 'AI resepşn xidməti' },
                { v: '0', l: 'Unudulan peyvənd' },
              ].map(s => (
                <div key={s.l}>
                  <p className="text-3xl font-display font-extrabold text-gradient">{s.v}</p>
                  <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-wider">{s.l}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-[1200px] mx-auto">
          <FadeUp className="text-center max-w-2xl mx-auto mb-16">
            <Badge tone="primary" className="mb-4">İmkanlar</Badge>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
              Klinikanızın hər guşəsi üçün bir modul
            </h2>
            <p className="mt-4 text-lg text-muted-foreground font-medium">
              Resepşndan laboratoriyaya, anbardan maliyyəyə — hamısı bir-biri ilə danışan vahid sistemdə.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} index={i % 3}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="h-full bg-card rounded-2xl border border-border p-7 shadow-soft hover:shadow-premium transition-shadow duration-300 group"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center group-hover:scale-110 group-hover:shadow-glow transition-all duration-300">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <Badge tone="primary">{f.tag}</Badge>
                  </div>
                  <h3 className="text-lg font-display font-extrabold tracking-tight mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AI SPOTLIGHT ============ */}
      <section id="ai" className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[hsl(202_36%_8%)] to-[hsl(180_30%_10%)] text-white p-8 sm:p-14 overflow-hidden shadow-premium">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <FadeUp>
                <Badge tone="success" className="mb-5 bg-emerald-500/15 text-emerald-300 border-emerald-400/25">
                  <Bot className="w-3.5 h-3.5" /> AI Resepşn
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight leading-tight">
                  Gecə 2-də zəng edən müştərini kim qarşılayır?
                </h2>
                <p className="mt-5 text-white/70 font-medium leading-relaxed">
                  AI resepşn WhatsApp-dan gələn səsli mesajı dinləyir, şikayəti anlayır, boş vaxtlara
                  uyğun randevu təklifi hazırlayır. Səhər gəldiyinizdə təsdiq gözləyən hazır randevular sizi qarşılayır.
                </p>
                <ul className="mt-7 space-y-3.5">
                  {[
                    'Səsli mesajları avtomatik mətnə çevirir və anlayır',
                    'Pasiyenti tarixçəsi ilə birlikdə tanıyır',
                    'Təcili halları ayırd edib həkimi dərhal xəbərdar edir',
                    'Hər randevu həkim təsdiqindən keçir — AI qərar vermir, hazırlayır',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm font-semibold text-white/85">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeUp>

              {/* Chat mockup */}
              <FadeUp index={2}>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl space-y-3 max-w-md mx-auto">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">VetKlinika AI</p>
                      <p className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> onlayn · 02:14
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3.5 text-sm font-medium max-w-[85%]">
                    🎙️ <span className="italic text-white/70">Səsli mesaj: "Pişiyim axşamdan qusur, nə edim?"</span>
                  </div>
                  <div className="bg-emerald-500/90 text-emerald-950 rounded-2xl rounded-tr-sm p-3.5 text-sm font-semibold max-w-[85%] ml-auto">
                    Salam! Məstanın vəziyyətini qeyd etdim. Sabah saat 10:00 və ya 11:30-a təcili müayinə təklif edirəm. Hansı uyğundur?
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3.5 text-sm font-medium max-w-[60%]">
                    10:00 olsun 🙏
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-300 pt-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Randevu hazırlandı — həkim təsdiqi gözlənilir
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-24 px-6 bg-aurora">
        <div className="max-w-[1100px] mx-auto">
          <FadeUp className="text-center max-w-2xl mx-auto mb-16">
            <Badge tone="primary" className="mb-4">Qiymətlər</Badge>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
              Bir itirilmiş müştəridən ucuz
            </h2>
            <p className="mt-4 text-lg text-muted-foreground font-medium">
              Unudulan bir peyvənd xatırlatması orta hesabla 40-60 ₼ itirilmiş gəlirdir. Sistem özünü ilk həftədə çıxarır.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan, i) => (
              <FadeUp key={plan.name} index={i} className="h-full">
                <div
                  className={`relative h-full flex flex-col rounded-3xl border p-8 transition-shadow duration-300 ${
                    plan.featured
                      ? 'bg-card border-primary/40 shadow-glow scale-[1.02]'
                      : 'bg-card border-border shadow-soft hover:shadow-premium'
                  }`}
                >
                  {plan.featured && (
                    <Badge tone="primary" className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-premium">
                      Ən Populyar
                    </Badge>
                  )}
                  <h3 className="text-lg font-display font-extrabold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">{plan.desc}</p>
                  <div className="mt-6 mb-7">
                    <span className="text-5xl font-display font-extrabold tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground font-bold text-sm"> ₼ / ay</span>
                  </div>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm font-semibold text-foreground/85">
                        <span className="w-4.5 h-4.5 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={plan.featured ? 'primary' : 'outline'}
                    onClick={() => setIsRegisterOpen(true)}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      {/* ============ TƏRƏFDAŞ KLİNİKALAR KATALOQU ============ */}
      <section className="py-16 px-6">
        <FadeUp className="max-w-[1200px] mx-auto">
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <PawPrint className="w-5 h-5 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary">Heyvan sahibləri üçün</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
                Etibarlı baytar klinikaları <span className="text-gradient">kataloqu</span>
              </h2>
              <p className="text-muted-foreground font-medium mt-3 max-w-xl">
                Şəhərinizdəki tərəfdaş klinikaları tapın: xidmətlər, həkimlər, iş saatları
                və bir toxunuşla WhatsApp randevusu.
              </p>
            </div>
            <Link href="/klinikalar" className="shrink-0">
              <Button size="lg">
                Klinikalara Bax <ArrowRight className="w-4.5 h-4.5" />
              </Button>
            </Link>
          </div>
        </FadeUp>
      </section>

      <section className="py-24 px-6">
        <FadeUp className="max-w-[900px] mx-auto text-center">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-primary to-accent text-primary-foreground p-10 sm:p-16 shadow-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative z-10">
              <Clock className="w-10 h-10 mx-auto mb-5 opacity-80" />
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
                Hər gün gecikmə = itirilmiş randevular
              </h2>
              <p className="mt-4 text-primary-foreground/85 font-medium max-w-xl mx-auto">
                5 dəqiqəyə qeydiyyatdan keçin, komandamız klinikanızı eyni gün sistemə köçürsün.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  variant="glass"
                  className="bg-white/95 text-emerald-900 hover:bg-white"
                  onClick={() => setIsRegisterOpen(true)}
                >
                  <Zap className="w-4.5 h-4.5" /> Pulsuz Sınağa Başla
                </Button>
                <a href="https://wa.me/994501234567" target="_blank" rel="noreferrer">
                  <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10">
                    <MessageCircle className="w-4.5 h-4.5" /> WhatsApp ilə Yaz
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="font-display font-extrabold">Vet<span className="text-primary">Klinika</span></span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">
            © {new Date().getFullYear()} VetKlinika. Bütün hüquqlar qorunur.
          </p>
          <div className="flex items-center gap-5 text-xs font-bold text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">İmkanlar</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Qiymətlər</a>
            <Link href="/klinikalar" className="hover:text-primary transition-colors">Klinikalar</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Giriş</Link>
          </div>
        </div>
      </footer>

      <RegisterRequestModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      <SuperAdminPanel />
    </div>
  )
}
