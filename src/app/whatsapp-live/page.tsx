'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  time: string
}

export default function WhatsappLivePage() {
  const [phone, setPhone] = useState('+994501234567')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: '🐾 VetKlinika WhatsApp AI Resepşn sisteminə xoş gəldiniz! Mesaj yazaraq canlı testi keçirə bilərsiniz.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsgText = input
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      time: userTime
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: userMsgText })
      })

      const data = await res.json()
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      if (data.success && data.replyMessage) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: data.replyMessage,
            time: botTime
          }
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: `⚠️ Xəta baş verdi: ${data.error || 'Naməlum xəta'}`,
            time: botTime
          }
        ])
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `⚠️ Şəbəkə xətası: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-xl bg-card rounded-2xl shadow-glow border border-border overflow-hidden flex flex-col h-[750px] glass-panel">
          
          {/* Header */}
          <div className="bg-primary/10 p-4 flex items-center justify-between border-b border-primary/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-lg border border-primary/30">
                🐾
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight text-foreground">VetKlinika AI WhatsApp</h1>
                <p className="text-xs text-primary flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Canlı Real Simulyasiya (Online)
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-semibold transition border border-border">
              Panələ Qayıt →
            </Link>
          </div>

          {/* Settings Bar */}
          <div className="bg-secondary/50 p-3 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">📱 Göndərən Nömrə:</span>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="bg-background border border-input rounded px-2 py-1 text-primary font-mono text-xs w-36 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <span className="text-muted-foreground hidden sm:inline">Real Webhook Live Engine</span>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-background/50 flex flex-col gap-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-secondary text-secondary-foreground rounded-bl-none border border-border'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1 font-medium">{msg.time}</span>
              </div>
            ))}
            {loading && (
              <div className="self-start bg-secondary text-secondary-foreground p-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 border border-border shadow-sm">
                <span className="animate-spin text-primary">🌀</span> AI WhatsApp mesajı oxuyur və bazaya işləyir...
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Mesajınızı bura yazın (məs: Mənim Diplo adlı itim var...)"
              className="flex-1 bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <span>Göndər</span>
              <span>➔</span>
            </button>
          </form>

        </div>
      </div>
    </AppShell>
  )
}

