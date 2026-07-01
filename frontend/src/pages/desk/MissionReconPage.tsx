import { Link, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { classifyEcart } from '../../lib/conversions'
import { exportOdooAdjustmentCsv, downloadText } from '../../lib/odoo'
import { formatMoney } from '../../lib/pricing'
import { canEditMission } from './CreateMissionPage'

export default function MissionReconPage() {
  const { missionId } = useParams<{ missionId: string }>()
  const { missions, lines, products, stores, entities, cadences, profiles, settings, validateMission } = useApp()
  const mission = missions.find((m) => m.id === missionId)
  if (!mission) return <p>Mission introuvable.</p>

  const store = stores.find((s) => s.id === mission.storeId)
  const entity = entities.find((e) => e.id === mission.entityId)
  const cadence = cadences.find((c) => c.id === mission.cadenceId)
  const controller = profiles.find((p) => p.id === mission.controllerId)
  const missionLines = lines.filter((l) => l.missionId === mission.id)
  const totalLoss = missionLines.reduce((s, l) => s + (l.ecartValue ?? 0), 0)

  const handleValidate = async () => {
    await validateMission(mission.id)
    alert(mission.isPermanent ? 'Mission permanente validée — prête pour le prochain cycle.' : 'Mission validée.')
  }

  const handleExport = () => {
    const rows = missionLines.map((l) => {
      const p = products.find((x) => x.id === l.productId)
      return {
        productCode: p?.odooProductCode || p?.code || '',
        designation: p?.designation || '',
        location: store?.odooLocationCode || store?.name || '',
        theoretical: l.systemQty,
        counted: l.physicalQty,
        ecart: l.ecart,
      }
    })
    downloadText(exportOdooAdjustmentCsv(rows, settings.odooExportPrefix), `${settings.odooExportPrefix}_${mission.id}.csv`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">{mission.name}</h1>
          <p className="text-sm text-slate-400">
            {store?.name} — {entity?.code} — {cadence?.name}
            {mission.isPermanent ? ' · Mission permanente' : ''}
            {controller ? ` · ${controller.name}` : ' · Non assigné'}
          </p>
        </div>
        <div className="flex gap-2">
          {canEditMission(mission) && (
            <Link
              to={`/desk/missions/${mission.id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-900"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </Link>
          )}
          {mission.status === 'SOUMIS' && (
            <button type="button" onClick={handleValidate} className="bg-emerald-600 px-4 py-2 rounded-xl text-xs font-bold">
              Valider mission
            </button>
          )}
          {mission.status === 'VALIDE' && (
            <button type="button" onClick={handleExport} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: 'var(--icams-primary)' }}>
              Exporter vers Odoo (CSV)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400">Formule</p>
          <p className="text-sm font-mono text-indigo-300">Écart = Physique − ERP</p>
        </div>
        <div className="bg-slate-950 border border-rose-900/40 rounded-xl p-4">
          <p className="text-xs text-slate-400">Perte totale valorisée</p>
          <p className="text-xl font-black text-rose-400">{formatMoney(totalLoss, settings.currency)}</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th className="p-4">Produit</th>
              <th className="p-4 text-center">ERP</th>
              <th className="p-4 text-center">Physique</th>
              <th className="p-4 text-center">Écart</th>
              <th className="p-4 text-right">Valeur perte</th>
              <th className="p-4">Classification</th>
              <th className="p-4">Observation</th>
            </tr>
          </thead>
          <tbody>
            {missionLines.map((l) => {
              const p = products.find((x) => x.id === l.productId)
              return (
                <tr key={l.id} className="border-b border-slate-800/50">
                  <td className="p-4">
                    <p className="font-bold">{p?.designation}</p>
                    <p className="text-slate-500">{p?.code}</p>
                  </td>
                  <td className="p-4 text-center font-bold">{l.systemQty}</td>
                  <td className="p-4 text-center font-bold">{l.physicalQty}</td>
                  <td className={`p-4 text-center font-black ${l.ecart < 0 ? 'text-rose-400' : l.ecart > 0 ? 'text-indigo-400' : ''}`}>
                    {l.ecart > 0 ? `+${l.ecart}` : l.ecart}
                  </td>
                  <td className="p-4 text-right font-bold text-rose-400">{formatMoney(l.ecartValue ?? 0, settings.currency)}</td>
                  <td className="p-4">{classifyEcart(l.ecart, l.avarieQty)}</td>
                  <td className="p-4 text-slate-400">{l.observation}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {missionLines.length === 0 && <p className="p-6 text-slate-500 text-sm">Aucune saisie pour cette mission.</p>}
      </div>
    </div>
  )
}
