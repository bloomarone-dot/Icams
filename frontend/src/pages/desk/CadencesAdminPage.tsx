import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { uid } from '../../lib/db'

export default function CadencesAdminPage() {
  const { cadences, saveCadence, deleteCadence } = useApp()
  const [form, setForm] = useState({ name: '', intervalDays: 30, description: '' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Cadences de mission</h1>
        <p className="text-sm text-slate-400">
          Définissez les fréquences d&apos;inventaire (journalier, mensuel, trimestriel, ou toute période personnalisée en jours).
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!form.name || form.intervalDays < 1) return
          await saveCadence({
            id: uid('CAD-'),
            name: form.name,
            intervalDays: form.intervalDays,
            description: form.description,
            active: true,
            sortOrder: cadences.length + 1,
          })
          setForm({ name: '', intervalDays: 30, description: '' })
        }}
        className="bg-slate-950 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <h2 className="md:col-span-3 font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Nouvelle cadence</h2>
        <input required placeholder="Nom (ex: Semestriel)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-admin" />
        <input required type="number" min={1} placeholder="Intervalle (jours)" value={form.intervalDays} onChange={(e) => setForm({ ...form, intervalDays: +e.target.value })} className="input-admin" />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-admin" />
        <button type="submit" className="md:col-span-3 py-2 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: 'var(--icams-primary)' }}>
          Ajouter la cadence
        </button>
      </form>

      <div className="space-y-2">
        {cadences.filter((c) => c.active).map((c) => (
          <div key={c.id} className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div>
              <p className="font-bold">{c.name}</p>
              <p className="text-xs text-slate-400">Tous les {c.intervalDays} jour{c.intervalDays > 1 ? 's' : ''} — {c.description}</p>
            </div>
            <button type="button" onClick={() => deleteCadence(c.id)} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
