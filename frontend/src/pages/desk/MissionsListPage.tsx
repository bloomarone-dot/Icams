import { Link } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { familyLabel } from '../../data/seed'
import { canEditMission } from './CreateMissionPage'

export default function MissionsListPage() {
  const { missions, stores, entities, cadences, profiles } = useApp()
  const sorted = [...missions].sort((a, b) => b.startedAt.localeCompare(a.startedAt))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black">Missions d&apos;inventaire</h1>
          <p className="text-sm text-slate-400">Créez et pilotez les missions assignées aux contrôleurs terrain.</p>
        </div>
        <Link
          to="/desk/missions/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--icams-primary)' }}
        >
          <Plus className="w-4 h-4" /> Créer une mission
        </Link>
      </div>

      <div className="space-y-3">
        {sorted.map((m) => {
          const store = stores.find((s) => s.id === m.storeId)
          const ent = entities.find((e) => e.id === m.entityId)
          const cad = cadences.find((c) => c.id === m.cadenceId)
          const ctrl = profiles.find((p) => p.id === m.controllerId)
          return (
            <div
              key={m.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-indigo-600"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <Link to={`/desk/missions/${m.id}`} className="flex-1 min-w-0">
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-slate-400">{store?.name} — {ent?.code} — {familyLabel(m.family)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {cad?.name}{m.isPermanent ? ' · Permanente' : ''} · {ctrl?.name || 'Non assigné'}
                  </p>
                </Link>
                <div className="flex items-start gap-2">
                  {canEditMission(m) && (
                    <Link
                      to={`/desk/missions/${m.id}/edit`}
                      className="p-2 rounded-lg border border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-white"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                  )}
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-800 h-fit">{m.status}</span>
                </div>
              </div>
            </div>
          )
        })}
        {sorted.length === 0 && (
          <p className="text-slate-500 text-sm bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
            Aucune mission. Cliquez sur &quot;Créer une mission&quot; pour commencer.
          </p>
        )}
      </div>
    </div>
  )
}
