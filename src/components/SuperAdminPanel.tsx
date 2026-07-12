'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Crown, Check, X, Building2, User, Phone, Mail, ShieldCheck, Sparkles, LogIn } from 'lucide-react'
import { AccessRequest } from './RegisterRequestModal'

/**
 * SuperAdmin paneli — real sessiya ilə qorunur.
 * Köhnə client-side MASTER_PIN silinib: giriş /login üzərindən,
 * icazə isə serverdə (api/access-requests rol yoxlaması) verilir.
 */
export default function SuperAdminPanel() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [me, setMe] = useState<{ authenticated: boolean; role?: string; name?: string } | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  const isSuperAdmin = me?.authenticated && (me.role === 'SUPERADMIN' || me.role === 'ADMIN')

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch('/api/me')
      setMe(res.ok ? await res.json() : { authenticated: false })
    } catch {
      setMe({ authenticated: false })
    }
  }, [])

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/access-requests')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setRequests(
            data.map((item: any) => ({
              ...item,
              createdAt:
                typeof item.createdAt === 'string' ? item.createdAt.slice(11, 16) : '12:00',
            }))
          )
        }
      }
    } catch (e) {
      console.error('Failed to fetch access requests:', e)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  useEffect(() => {
    if (!isSuperAdmin) return
    loadRequests()
    const interval = setInterval(loadRequests, 10000)
    return () => clearInterval(interval)
  }, [isSuperAdmin, loadRequests])

  const updateStatus = async (reqId: string, status: 'APPROVED' | 'REJECTED') => {
    setFeedback(null)
    if (status === 'REJECTED') {
      setRequests(prev => prev.map(r => (r.id === reqId ? { ...r, status } : r)))
    }
    try {
      const res = await fetch('/api/access-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reqId, status }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Əməliyyat uğursuz oldu.' })
        return
      }

      if (status === 'APPROVED') {
        setRequests(prev => prev.map(r => (r.id === reqId ? { ...r, status: 'APPROVED' } : r)))

        const channels: string[] = []
        if (data?.emailSent) channels.push('email')
        if (data?.whatsappSent) channels.push('WhatsApp')
        const setupUrl = data?.setupUrl || '/forgot-password'

        if (channels.length > 0) {
          // Ən azı bir kanal çatdı — müştəri təlimatı aldı, indi öz şifrəsini təyin edəcək
          setFeedback({
            type: 'success',
            text: `Təsdiqləndi — şifrə təyinetmə təlimatı ${channels.join(' və ')} ilə göndərildi. Müştəri kod alıb öz şifrəsini seçəcək.`,
          })
        } else {
          // Bildiriş getmədi — gizli məlumat yoxdur, admin sadəcə təlimatı ötürür
          setFeedback({
            type: 'warning',
            text: `Hesab yaradıldı, amma bildiriş getmədi. Müştəriyə deyin: ${setupUrl} → nömrəsini yazsın → gələn kodla öz şifrəsini təyin etsin.`,
          })
        }
      }
    } catch (err) {
      console.error('API update failed:', err)
      setFeedback({ type: 'error', text: 'Şəbəkə xətası — yenidən cəhd edin.' })
    }
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  // Giriş etməmiş ziyarətçilərə düymə görünmür — panel yalnız sahibə məxsusdur
  if (me === null || !me.authenticated) return null
  if (!isSuperAdmin) return null

  return (
    <>
      {/* SuperAdmin trigger */}
      <button
        onClick={() => { setIsOpen(true); loadRequests() }}
        className="fixed bottom-24 right-6 z-50 bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-5 py-3.5 rounded-full shadow-premium flex items-center gap-3 font-extrabold text-xs transition-all hover:scale-105 active:scale-95"
      >
        <Crown className="w-4.5 h-4.5 text-warning" />
        <span>Yaradıcı Paneli</span>
        {pendingCount > 0 && (
          <span className="bg-destructive text-destructive-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
            {pendingCount} YENİ
          </span>
        )}
      </button>

      {/* Panel modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-3xl p-8 max-w-2xl w-full shadow-premium border border-border relative space-y-6 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-secondary transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-border pb-4">
              <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning border border-warning/25 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-display font-extrabold">SuperAdmin İdarəetmə Mərkəzi</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Xoş gəldiniz, <strong className="text-foreground">{me.name}</strong> — müştəri
                  qeydiyyat müraciətlərini buradan təsdiqləyin
                </p>
              </div>
            </div>

            {feedback && (
              <div className={`text-xs font-bold px-4 py-3 rounded-xl border flex items-center justify-between gap-3 ${
                feedback.type === 'success' ? 'bg-success/10 text-success border-success/25' :
                feedback.type === 'warning' ? 'bg-warning/10 text-warning border-warning/25' :
                'bg-destructive/10 text-destructive border-destructive/25'
              }`}>
                <span>{feedback.text}</span>
                <button onClick={() => setFeedback(null)} className="shrink-0 opacity-70 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success" /> Daxil Olan Müştəri Müraciətləri ({requests.length})
              </h4>

              {requests.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  Hələ ki müştəri müraciəti yoxdur.
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div
                      key={req.id}
                      className="bg-secondary/50 p-5 rounded-2xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-ring/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-extrabold text-sm">{req.doctorName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono bg-card px-2 py-0.5 rounded-md border border-border">
                            {req.createdAt}
                          </span>
                        </div>
                        <p className="text-xs font-bold flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-warning" /> {req.clinicName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-accent" /> {req.phone}
                        </p>
                        {req.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-accent" /> {req.email}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                        {req.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => updateStatus(req.id, 'REJECTED')}
                              className="px-3 py-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground font-bold text-xs rounded-xl transition-all"
                            >
                              İmtina Et
                            </button>
                            <button
                              onClick={() => updateStatus(req.id, 'APPROVED')}
                              className="px-5 py-2.5 bg-primary hover:brightness-110 text-primary-foreground font-extrabold text-xs rounded-xl shadow-premium transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" /> Təsdiqlə
                            </button>
                          </>
                        ) : req.status === 'APPROVED' ? (
                          <span className="px-4 py-2 bg-success/10 text-success border border-success/25 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Təsdiqləndi
                          </span>
                        ) : (
                          <span className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/25 text-xs font-bold rounded-xl">
                            İmtina Edildi
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
