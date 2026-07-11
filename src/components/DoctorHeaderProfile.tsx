import { getProfileData } from '@/app/actions/profile'

export default async function DoctorHeaderProfile() {
  const data = await getProfileData()
  const doctorName = data?.user?.name || 'Həkim'
  const doctorTitle = data?.user?.title || ''
  const doctorPhoto = data?.user?.photoUrl || null

  return (
    <div className="flex items-center gap-4 border-t lg:border-t-0 border-border pt-3 lg:pt-0 w-full lg:w-auto justify-end">
      <div className="text-right block">
        <h4 className="text-xs font-black text-foreground truncate max-w-[140px] sm:max-w-none">{doctorName}</h4>
        {doctorTitle && (
          <p className="text-[10px] font-bold text-primary flex items-center justify-end gap-1 truncate max-w-[140px] sm:max-w-none">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0"></span> {doctorTitle}
          </p>
        )}
      </div>
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-warning/30 to-primary/30 p-0.5 shadow-md overflow-hidden flex items-center justify-center">
        {doctorPhoto ? (
          <img src={doctorPhoto} alt="Doctor" className="w-full h-full object-cover rounded-[0.9rem]" />
        ) : (
          <div className="w-full h-full bg-secondary rounded-[0.9rem] flex items-center justify-center text-foreground font-black text-sm">
            👨‍⚕️
          </div>
        )}
      </div>
    </div>
  )
}
