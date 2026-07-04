'use client'

import { useState, useEffect } from 'react'

export default function DoctorHeaderProfile() {
  const [doctorName, setDoctorName] = useState('Dr. Rəşad Əliyev')
  const [doctorTitle, setDoctorTitle] = useState('Növbətçi Baş Həkim')
  const [doctorPhoto, setDoctorPhoto] = useState<string | null>(null)

  useEffect(() => {
    const savedName = localStorage.getItem('doctorName')
    const savedTitle = localStorage.getItem('doctorTitle')
    const savedPhoto = localStorage.getItem('doctorPhoto')
    if (savedName) setDoctorName(savedName)
    if (savedTitle) setDoctorTitle(savedTitle)
    if (savedPhoto) setDoctorPhoto(savedPhoto)

    const handleStorageChange = () => {
      const updatedName = localStorage.getItem('doctorName')
      const updatedTitle = localStorage.getItem('doctorTitle')
      const updatedPhoto = localStorage.getItem('doctorPhoto')
      if (updatedName) setDoctorName(updatedName)
      if (updatedTitle) setDoctorTitle(updatedTitle)
      setDoctorPhoto(updatedPhoto)
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
      <div className="text-right block">
        <h4 className="text-xs font-black text-slate-900 truncate max-w-[140px] sm:max-w-none">{doctorName}</h4>
        <p className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1 truncate max-w-[140px] sm:max-w-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span> {doctorTitle}
        </p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-200 to-emerald-200 p-0.5 shadow-md overflow-hidden flex items-center justify-center">
        {doctorPhoto ? (
          <img src={doctorPhoto} alt="Doctor" className="w-full h-full object-cover rounded-[0.9rem]" />
        ) : (
          <div className="w-full h-full bg-slate-800 rounded-[0.9rem] flex items-center justify-center text-white font-black text-sm">
            👨‍⚕️
          </div>
        )}
      </div>
    </div>
  )
}
