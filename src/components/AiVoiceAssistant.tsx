'use client'

import { useState, useEffect, useRef } from 'react'

export default function AiVoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'az-AZ'

        recognition.onresult = (event: any) => {
          let currentTranscript = ''
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          setTranscript(currentTranscript)
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      } else {
        setIsSupported(false)
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      parseAndDistributeText(transcript)
    } else {
      setTranscript('')
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const parseAndDistributeText = (text: string) => {
    if (!text) return

    let temp = ''
    let weight = ''
    let reason = ''
    let doctorNotes = ''
    let treatment = ''

    let cleanedText = text

    // 1. Temperaturu tapırıq və əsas mətndən silirik
    const tempRegex1 = /(?:hərarət[a-z]*|temperatur[a-z]*)\s*(?:budur|olub|dir|dur|dür|dır|qədərdir|[\s:])*\s*(\d+[.,]?\d*)/i
    const tempRegex2 = /(\d+[.,]?\d*)\s*(?:dərəcə|derece|°C)/i
    
    let tMatch = cleanedText.match(tempRegex1) || cleanedText.match(tempRegex2)
    if (tMatch) {
      temp = tMatch[1] || tMatch[2] || tMatch[0]
      // Rəqəmi təmizləmək üçün:
      const numMatch = temp.match(/(\d+[.,]?\d*)/)
      if (numMatch) temp = numMatch[1]
      cleanedText = cleanedText.replace(tMatch[0], '') // Mətndən çıxar
    }

    // 2. Çəkini tapırıq və əsas mətndən silirik
    const weightRegex1 = /(?:çəki[a-z]*)\s*(?:budur|olub|dir|dur|dür|dır|qədərdir|[\s:])*\s*(\d+[.,]?\d*)/i
    const weightRegex2 = /(\d+[.,]?\d*)\s*(?:kq|kilo|kiloqram|qram)/i

    let wMatch = cleanedText.match(weightRegex2) || cleanedText.match(weightRegex1)
    if (wMatch) {
      weight = wMatch[1] || wMatch[2] || wMatch[0]
      const numMatch = weight.match(/(\d+[.,]?\d*)/)
      if (numMatch) weight = numMatch[1]
      cleanedText = cleanedText.replace(wMatch[0], '') // Mətndən çıxar
    }

    // Mətni hissələrə bölmək üçün məntiq
    let currentSection = 'reason'
    // İki boşluqları silib, sözlərə ayırırıq
    const words = cleanedText.replace(/\s+/g, ' ').trim().split(' ')
    
    for (const word of words) {
      const w = word.toLowerCase()
      if (w.includes('diaqnoz') || w.includes('həkim') || w.includes('assessment')) {
        currentSection = 'doctorNotes'
        continue
      }
      if (w.includes('müalicə') || w.includes('dərman') || w.includes('resept') || w.includes('plan')) {
        currentSection = 'treatment'
        continue
      }
      if (w.includes('şikayət') || w.includes('səbəb')) {
        currentSection = 'reason'
        continue
      }
      
      if (currentSection === 'reason') reason += word + ' '
      else if (currentSection === 'doctorNotes') doctorNotes += word + ' '
      else if (currentSection === 'treatment') treatment += word + ' '
    }

    // DOM vasitəsilə form xanalarına yazmaq (Uncontrolled komponentlərdə ən asan yol)
    const reasonEl = document.querySelector('textarea[name="reason"]') as HTMLTextAreaElement
    const doctorNotesEl = document.querySelector('textarea[name="doctorNotes"]') as HTMLTextAreaElement
    const treatmentEl = document.querySelector('textarea[name="treatment"]') as HTMLTextAreaElement
    const tempEl = document.querySelector('input[name="temperature"]') as HTMLInputElement
    const weightEl = document.querySelector('input[name="weight"]') as HTMLInputElement // Çəki xanası

    if (reasonEl && reason) reasonEl.value = reason.trim()
    if (doctorNotesEl && doctorNotes) doctorNotesEl.value = doctorNotes.trim()
    if (treatmentEl && treatment) treatmentEl.value = treatment.trim()
    if (tempEl && temp) tempEl.value = temp.replace(',', '.')
    if (weightEl && weight) weightEl.value = weight.replace(',', '.')
  }

  if (!isSupported) {
    return <div className="text-red-500 text-sm p-4 bg-red-50 rounded-xl mt-8">Səs tanıma bu brauzerdə dəstəklənmir (Zəhmət olmasa Google Chrome istifadə edin).</div>
  }

  return (
    <div className={`mt-8 border rounded-2xl p-6 transition-all duration-500 ${
      isListening ? 'bg-indigo-900 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : 'bg-indigo-50 border-indigo-100'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-bold mb-1 flex items-center gap-2 ${isListening ? 'text-indigo-100' : 'text-indigo-900'}`}>
            {isListening ? (
              <><span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span> AI Dinləyir...</>
            ) : (
              <><span className="text-xl">🤖</span> AI Səsli Asistan</>
            )}
          </h3>
          <p className={`text-sm ${isListening ? 'text-indigo-300' : 'text-indigo-600'}`}>
            {isListening 
              ? 'Danışın... (Bitirəndə Təsdiq düyməsinə basın)'
              : 'Mikrofona basıb şikayət, diaqnoz və müalicəni səsli deyin.'}
          </p>
        </div>
        <button 
          onClick={toggleListening}
          type="button"
          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${
            isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white'
          }`}
        >
          {isListening ? '⏹' : '🎤'}
        </button>
      </div>
      
      {transcript && (
        <div className="mt-4 p-4 bg-black/10 rounded-xl">
          <p className={`italic ${isListening ? 'text-indigo-100' : 'text-indigo-800'}`}>"{transcript}"</p>
        </div>
      )}
    </div>
  )
}
