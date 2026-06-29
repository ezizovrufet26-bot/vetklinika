'use me'
'use client'

import { useState } from 'react'
import Link from 'next/link'

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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col h-[750px]">
        
        {/* Header */}
        <div className="bg-emerald-700 p-4 flex items-center justify-between text-white shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center font-bold text-lg border border-emerald-500">
              🐾
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">VetKlinika AI WhatsApp</h1>
              <p className="text-xs text-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Canlı Real Simulyasiya (Online)
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 rounded-lg text-xs font-semibold transition">
            Panələ Qayıt →
          </Link>
        </div>

        {/* Settings Bar */}
        <div className="bg-slate-850 p-3 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span>📱 Göndərən Nömrə:</span>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono text-xs w-36 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-slate-400">Real Webhook Live Engine</span>
        </div>

        {/* Chat Body */}
        <div className="flex-1 p-4 overflow-y-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex flex-col gap-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-100 rounded-bl-none border border-slate-600'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
          {loading && (
            <div className="self-start bg-slate-700 text-slate-300 p-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 border border-slate-600">
              <span className="animate-spin">🌀</span> AI WhatsApp mesajı oxuyur və bazaya işləyir...
            </div>
          )}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Mesajınızı bura yazın (məs: Mənim Diplo adlı itim var, sabah saat 15:00-a müayinə...)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1 shadow-lg"
          >
            <span>Göndər</span>
            <span>➔</span>
          </button>
        </form>

      </div>
    </div>
  )
}
