'use client'

interface LabResult {
  id: string
  deviceName: string
  testType: string
  dataJson: string
  createdAt: Date | string
}

export default function LabResultsTable({ labResults }: { labResults: LabResult[] }) {
  if (labResults.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center py-10">
        <span className="text-4xl">🩸</span>
        <p className="font-bold text-slate-700 mt-2">Hələ laboratoriya analizi daxil olmayıb</p>
        <p className="text-xs text-slate-400 mt-1">Zoetis Vetscan və ya IDEXX aparatı analizi bitirən kimi neticələr bura gələcək.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
        <span>🩸</span> Avtomatlaşdırılmış Laboratoriya Nəticələri
        <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full">
          {labResults.length} Analiz
        </span>
      </h3>

      <div className="space-y-6">
        {labResults.map((lab) => {
          let items: any[] = []
          try {
            items = JSON.parse(lab.dataJson)
          } catch (e) {
            items = []
          }

          return (
            <div key={lab.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black px-2 py-0.5 bg-red-500 rounded-md uppercase mr-2">
                    {lab.testType}
                  </span>
                  <span className="font-bold text-sm">{lab.deviceName}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(lab.createdAt).toLocaleString('az-AZ')}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-3">Göstərici (Parameter)</th>
                      <th className="p-3 text-center">Nəticə</th>
                      <th className="p-3 text-center">Norma Aralığı</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {items.map((item: any, idx: number) => {
                      const isHigh = item.status === 'HIGH'
                      const isLow = item.status === 'LOW'

                      return (
                        <tr key={idx} className={isHigh || isLow ? 'bg-red-50/40' : ''}>
                          <td className="p-3 font-bold text-slate-800">{item.param} ({item.unit})</td>
                          <td className="p-3 text-center font-black text-slate-900 text-sm">{item.value}</td>
                          <td className="p-3 text-center text-slate-500">{item.min} - {item.max}</td>
                          <td className="p-3 text-right">
                            {isHigh ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-md">⬆️ Yüksək</span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded-md">⬇️ Aşağı</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-md">✓ Norma</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
