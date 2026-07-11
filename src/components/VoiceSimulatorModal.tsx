'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { processAiReceptionistMessage } from '@/app/actions/ai-receptionist'

export default function VoiceSimulatorModal() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [phone, setPhone] = useState('+994501234567')
  const [loading, setLoading] = useState(false)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)

    // Setup Browser Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'az-AZ' // Azerbaijani language recognition

      recognition.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        setTranscript(currentTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Sizin brauzeriniz canlı səs tanımalarını dəstəkləmir. Google Chrome istifadə etməyiniz tövsiyə olunur.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      setAiResponse('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'az-AZ'
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleProcessVoice = async () => {
    if (!transcript) return
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    setLoading(true)
    setAiResponse('🧠 AI səsinizi təhlil edir...')

    try {
      const res = await processAiReceptionistMessage({ text: transcript, phone })

      setLoading(false)
      if (res.success && res.replyMessage) {
        setAiResponse(res.replyMessage)
        speakText(res.replyMessage)
      } else {
        setAiResponse(`❌ Xəta: ${res.error || 'Qeydə alına bilmədi'}`)
      }
    } catch (e: any) {
      setLoading(false)
      setAiResponse(`❌ Xəta baş verdi: ${e.message}`)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-md shadow-purple-600/20 transition-all hover:-translate-y-0.5 flex items-center gap-2 text-xs"
      >
        <span className="text-base">🎙️</span> Canlı AI Zəng
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl border border-purple-100 animate-in fade-in duration-200 relative z-[10000]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl text-purple-700 font-black">
                  📞
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Canlı AI Zəng Testi</h3>
                  <p className="text-xs text-slate-500">Mikrofonla danışın, AI canlı səsli cavab versin</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel()
                  setIsOpen(false)
                }}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Müştəri Nömrəsi</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
              </div>

              {/* REAL Live Microphone Button */}
              <div className="text-center py-6 bg-gradient-to-b from-purple-50 to-indigo-50/30 rounded-3xl border border-purple-100/80">
                <button
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto shadow-xl transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 scale-110'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:scale-105 shadow-purple-600/30'
                  }`}
                >
                  {isListening ? '🟥' : '🎙️'}
                </button>
                <p className="text-sm font-black text-purple-900 mt-4">
                  {isListening ? '🟢 Sizi Dinləyirəm... (Danışın)' : 'Mikrofonu Sıxın və Danışmağa Başlayın'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Danışıb bitirdikdən sonra təzədən sıxın və ya aşağıdakı düyməyə basın</p>
              </div>

              {/* Live Transcript Box */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Sizin Dedikləriniz (Real-Time):</label>
                <div className="min-h-[80px] bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 leading-relaxed">
                  {transcript || <span className="text-slate-400 italic">Mikrofonu açıb danışın, dedikləriniz bura yazılacaq...</span>}
                </div>
              </div>

              {/* AI Live Audio Response Box */}
              {aiResponse && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold leading-relaxed animate-fade-in flex items-start gap-3">
                  <span className="text-xl">🔊</span>
                  <div>
                    <p className="font-black text-emerald-800 text-sm mb-1">AI Canlı Səsli Cavab Verir:</p>
                    <p>{aiResponse}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleProcessVoice}
                disabled={loading || !transcript}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all disabled:opacity-40"
              >
                {loading ? 'AI Təhlil Edir...' : 'Zəngi Bitir & AI Cavab Versin →'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
