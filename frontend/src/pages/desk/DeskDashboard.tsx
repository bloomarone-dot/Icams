import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { classifyEcart } from '../../lib/conversions'
import { formatMoney } from '../../lib/pricing'

export default function DeskDashboard() {
  const { missions, lines, stores, entities, syncQueue, products, settings } = useApp()
  const submitted = missions.filter((m) => m.status === 'SOUMIS')
  const auditedLines = lines.filter((l) => {
    const m = missions.find((x) => x.id === l.missionId)
    return m && (m.status === 'SOUMIS' || m.status === 'VALIDE')
  })
  const exact = auditedLines.filter((l) => l.ecart === 0 && l.avarieQty === 0).length
  const accuracy = auditedLines.length ? Math.round((exact / auditedLines.length) * 100) : 100
  const ecartValue = auditedLines.reduce((s, l) => s + (l.ecartValue ?? 0), 0)
  const pendingSync = syncQueue.filter((q) => q.status === 'PENDING').length

  const problemStores = missions
    .filter((m) => m.status === 'SOUMIS' || m.status === 'VALIDE')
    .map((m) => {
      const mLines = lines.filter((l) => l.missionId === m.id)
      const totalValue = mLines.reduce((s, l) => s + (l.ecartValue ?? 0), 0)
      return { mission: m, store: stores.find((s) => s.id === m.storeId), totalValue }
    })
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">Tableau de bord direction</h1>
        <p className="text-sm text-slate-400">Vue consolidée des missions terrain et écarts d&apos;audit</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Taux d'exactitude" value={`${accuracy}%`} />
        <Kpi label="Valeur des pertes / écarts" value={formatMoney(ecartValue, settings.currency)} />
        <Kpi label="Missions à valider" value={String(submitted.length)} />
        <Kpi label="Sync en attente" value={String(pendingSync)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Missions soumises</h2>
          {submitted.length === 0 && <p className="text-xs text-slate-500">Aucune mission en attente.</p>}
          <div className="space-y-3">
            {submitted.map((m) => {
              const store = stores.find((s) => s.id === m.storeId)
              const ent = entities.find((e) => e.id === m.entityId)
              return (
                <Link key={m.id} to={`/desk/missions/${m.id}`} className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-600">
                  <p className="font-bold text-sm">{m.name}</p>
                  <p className="text-[10px] text-slate-400">{store?.name} — {ent?.code}</p>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Magasins avec écarts élevés</h2>
          {problemStores.length === 0 && <p className="text-xs text-slate-500">Pas de données.</p>}
          <div className="space-y-2">
            {problemStores.map(({ store, totalValue, mission }) => (
              <div key={mission.id} className="flex justify-between bg-slate-900 rounded-xl p-3 text-sm">
                <span>{store?.name}</span>
                <span className="text-rose-400 font-bold">{formatMoney(totalValue, settings.currency)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {auditedLines.length > 0 && (
        <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
          <h2 className="font-bold mb-4">Derniers écarts constatés</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-2">Produit</th>
                <th className="pb-2 text-center">ERP</th>
                <th className="pb-2 text-center">Physique</th>
                <th className="pb-2 text-center">Écart</th>
                <th className="pb-2 text-right">Valeur</th>
                <th className="pb-2">Classification</th>
              </tr>
            </thead>
            <tbody>
              {auditedLines.slice(-8).reverse().map((l) => {
                const p = products.find((x) => x.id === l.productId)
                return (
                <tr key={l.id} className="border-b border-slate-800/50">
                  <td className="py-2">{p?.designation ?? l.productId}</td>
                  <td className="py-2 text-center">{l.systemQty}</td>
                  <td className="py-2 text-center">{l.physicalQty}</td>
                  <td className={`py-2 text-center font-bold ${l.ecart < 0 ? 'text-rose-400' : l.ecart > 0 ? 'text-indigo-400' : ''}`}>{l.ecart}</td>
                  <td className="py-2 text-right text-rose-400">{formatMoney(l.ecartValue ?? 0, settings.currency)}</td>
                  <td className="py-2">{classifyEcart(l.ecart, l.avarieQty)}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  )
}
