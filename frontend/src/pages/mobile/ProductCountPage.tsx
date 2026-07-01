import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { defaultCountData } from '../../lib/conversions'
import { CigaretteCountForm, GadgetCountForm, VapeCountForm } from '../../components/CountForms'
import type { CountData } from '../../types'

export default function ProductCountPage() {
  const { missionId, productId } = useParams<{ missionId: string; productId: string }>()
  const navigate = useNavigate()
  const { missions, products, lines, settings, saveInventoryLine } = useApp()
  const mission = missions.find((m) => m.id === missionId)
  const product = products.find((p) => p.id === productId)
  const existing = lines.find((l) => l.missionId === missionId && l.productId === productId)

  const [countData, setCountData] = useState<CountData>(
    existing?.countData ?? (product ? defaultCountData(product.family) : defaultCountData('CIGARETTE'))
  )
  const [observation, setObservation] = useState(existing?.observation ?? 'RAS')

  useEffect(() => {
    if (product && !existing) setCountData(defaultCountData(product.family))
  }, [product, existing])

  if (!mission || !product) return <p className="text-rose-400 text-sm">Produit ou mission introuvable.</p>

  const handleSave = async () => {
    await saveInventoryLine(mission.id, product.id, countData, observation)
    navigate(`/mobile/mission/${mission.id}`)
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <p className="text-[10px] text-indigo-400 font-mono">{product.code}</p>
        <h1 className="text-base font-black">{product.designation}</h1>
        <p className="text-[10px] text-slate-500">{product.brand} — {product.packaging}</p>
      </div>

      {product.family === 'CIGARETTE' && countData.type === 'CIGARETTE' && (
        <CigaretteCountForm data={countData} onChange={setCountData} />
      )}
      {product.family === 'VAPE' && countData.type === 'VAPE' && (
        <VapeCountForm data={countData} onChange={setCountData} />
      )}
      {product.family === 'GADGET' && countData.type === 'GADGET' && (
        <GadgetCountForm data={countData} onChange={setCountData} />
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300">Observation</label>
        <select
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm mb-2"
        >
          {settings.observationTemplates.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm"
          placeholder="Justification de l'écart..."
        />
      </div>

      <button type="button" onClick={handleSave} className="w-full bg-indigo-600 rounded-2xl py-4 font-bold text-sm">
        Enregistrer
      </button>
    </div>
  )
}
