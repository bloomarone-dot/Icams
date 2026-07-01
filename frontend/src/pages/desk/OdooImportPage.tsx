import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { importOdooFile } from '../../lib/odoo'

export default function OdooImportPage() {
  const { stores, products, settings, importSnapshot } = useApp()
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !storeId) {
      setMessage('Sélectionnez un magasin et un fichier.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const snap = await importOdooFile(file, storeId, settings, products.filter((p) => p.active))
      await importSnapshot(snap)
      setMessage(`Import réussi : ${snap.lines.length} produits reconnus depuis ${file.name}`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur import')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black">Import stock Odoo</h1>
        <p className="text-sm text-slate-400">
          Chargez l&apos;export CSV ou XLSX d&apos;Odoo avant la mission terrain. Le mapping des colonnes se configure dans Paramètres.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300">Magasin cible</label>
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-sm"
        >
          <option value="">— Choisir un magasin —</option>
          {stores.filter((s) => s.active).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center bg-slate-950">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          disabled={!storeId || loading}
          onChange={handleFile}
          className="text-sm"
        />
        <p className="text-[10px] text-slate-500 mt-2">CSV ou XLSX — export stock Odoo par emplacement</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1">
        <p className="font-bold text-slate-300">Colonnes attendues (configurables) :</p>
        <p>Code produit → <code className="text-indigo-300">{settings.odooImportMapping.productCode}</code></p>
        <p>Désignation → <code className="text-indigo-300">{settings.odooImportMapping.productName}</code></p>
        <p>Quantité → <code className="text-indigo-300">{settings.odooImportMapping.quantity}</code></p>
      </div>

      {message && (
        <p className={`text-sm p-4 rounded-xl ${message.includes('réussi') ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
