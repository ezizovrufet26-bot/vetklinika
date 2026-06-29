'use client'

import { useState, useEffect } from 'react'

export default function DoctorHeaderProfile() {
  const [doctorName, setDoctorName] = useState('Dr. Rəşad Əliyev')
  const [doctorTitle, setDoctorTitle] = useState('Növbətçi Baş Həkim')

  useEffect(() => {
    const savedName = localStorage.getItem('doctorName')
    const savedTitle = localStorage.getItem('doctorTitle')
    if (savedName) setDoctorName(savedName)
    if (savedTitle) setDoctorTitle(savedTitle)

    const handleStorageChange = () => {
      const updatedName = localStorage.getItem('doctorName')
      const updatedTitle = localStorage.getItem('doctorTitle')
      if (updatedName) setDoctorName(updatedName)
      if (updatedTitle) setDoctorTitle(updatedTitle)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('doctorProfileUpdate', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('doctorProfileUpdate', handleStorageChange)
    }
  }, [])

  return (
    <div className="flex items-center gap-4 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
      <div className="text-right hidden sm:block">
        <h4 className="text-xs font-black text-slate-900">{doctorName}</h4>
        <p className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {doctorTitle}
        </p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-200 to-emerald-200 p-0.5 shadow-md">
        <div className="w-full h-full bg-slate-800 rounded-[0.9rem] flex items-center justify-center text-white font-black text-sm">
          👨‍⚕️
        </div>
      </div>
    </div>
  )
}
