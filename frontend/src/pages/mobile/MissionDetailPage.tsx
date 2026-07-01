import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Circle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { familyLabel } from '../../data/seed'

export default function MissionDetailPage() {
  const { missionId } = useParams<{ missionId: string }>()
  const { missions, products, lines, stores, entities, submitMission } = useApp()
  const mission = missions.find((m) => m.id === missionId)
  if (!mission) return <p className="text-rose-400 text-sm">Mission introuvable.</p>

  const store = stores.find((s) => s.id === mission.storeId)
  const entity = entities.find((e) => e.id === mission.entityId)
  const catalog = products.filter(
    (p) => p.active && p.entityId === mission.entityId && p.family === mission.family
  )
  const missionLines = lines.filter((l) => l.missionId === mission.id)
  const doneIds = new Set(missionLines.map((l) => l.productId))
  const progress = catalog.length ? Math.round((doneIds.size / catalog.length) * 100) : 0

  const handleSubmit = async () => {
    if (!confirm('Soumettre la mission à la direction ?')) return
    await submitMission(mission.id)
    alert(navigator.onLine ? 'Mission soumise à la direction.' : 'Mission enregistrée localement. Synchronisation dès que le réseau revient.')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-black">{mission.name}</h1>
        <p className="text-xs text-slate-400">{store?.name} — {entity?.code} — {familyLabel(mission.family)}</p>
        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">{doneIds.size}/{catalog.length} produits saisis — {progress}%</p>
      </div>

      <div className="space-y-2">
        {catalog.map((p) => {
          const line = missionLines.find((l) => l.productId === p.id)
          const done = doneIds.has(p.id)
          return (
            <Link
              key={p.id}
              to={`/mobile/mission/${mission.id}/product/${p.id}`}
              className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-indigo-600"
            >
              <div>
                <p className="text-sm font-semibold">{p.designation}</p>
                <p className="text-[10px] text-slate-500">{p.code}</p>
              </div>
              <div className="text-right">
                {done ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400 ml-auto" />
                    <p className="text-[10px] text-slate-400 mt-1">ERP {line?.systemQty} → {line?.physicalQty}</p>
                  </>
                ) : (
                  <Circle className="w-5 h-5 text-slate-600 ml-auto" />
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {mission.status !== 'SOUMIS' && mission.status !== 'VALIDE' && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={doneIds.size === 0}
          className="w-full bg-emerald-600 disabled:opacity-40 rounded-2xl py-4 font-bold text-sm"
        >
          Soumettre à la direction
        </button>
      )}
      {(mission.status === 'SOUMIS' || mission.status === 'VALIDE') && (
        <p className="text-center text-emerald-400 text-xs font-bold">Mission {mission.status.toLowerCase()}</p>
      )}
    </div>
  )
}
