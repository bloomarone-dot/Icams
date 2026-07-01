import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { uid } from '../../lib/db'

export default function StoresAdminPage() {
  const { zones, sites, stores, saveZone, saveSite, saveStore, deleteZone, deleteSite, deleteStore } = useApp()
  const [zoneName, setZoneName] = useState('')
  const [siteForm, setSiteForm] = useState({ zoneId: '', name: '' })
  const [storeForm, setStoreForm] = useState({ siteId: '', name: '', odooLocationCode: '' })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Zones, sites &amp; magasins</h1>

      <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Zones</h2>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!zoneName) return
            await saveZone({ id: uid('ZON-'), name: zoneName, active: true })
            setZoneName('')
          }}
        >
          <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="Nom zone" className="input-admin flex-1" />
          <button type="submit" className="bg-indigo-600 px-4 rounded-xl text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Ajouter</button>
        </form>
        <ul className="space-y-1 text-sm">
          {zones.filter((z) => z.active).map((z) => (
            <li key={z.id} className="flex justify-between bg-slate-900 rounded-lg px-3 py-2">
              {z.name}
              <button type="button" onClick={() => deleteZone(z.id)} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Sites / Villes</h2>
        <form
          className="grid grid-cols-1 md:grid-cols-3 gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!siteForm.zoneId || !siteForm.name) return
            await saveSite({ id: uid('SITE-'), zoneId: siteForm.zoneId, name: siteForm.name, active: true })
            setSiteForm({ zoneId: '', name: '' })
          }}
        >
          <select value={siteForm.zoneId} onChange={(e) => setSiteForm({ ...siteForm, zoneId: e.target.value })} className="input-admin">
            <option value="">Zone</option>
            {zones.filter((z) => z.active).map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <input value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} placeholder="Ville" className="input-admin" />
          <button type="submit" className="bg-indigo-600 rounded-xl text-sm font-bold">Ajouter site</button>
        </form>
        <ul className="space-y-1 text-sm">
          {sites.filter((s) => s.active).map((s) => (
            <li key={s.id} className="flex justify-between bg-slate-900 rounded-lg px-3 py-2">
              <span>{s.name} <span className="text-slate-500">({zones.find((z) => z.id === s.zoneId)?.name})</span></span>
              <button type="button" onClick={() => deleteSite(s.id)} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Magasins</h2>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!storeForm.siteId || !storeForm.name) return
            await saveStore({
              id: uid('MAG-'),
              siteId: storeForm.siteId,
              name: storeForm.name,
              odooLocationCode: storeForm.odooLocationCode || undefined,
              active: true,
            })
            setStoreForm({ siteId: '', name: '', odooLocationCode: '' })
          }}
        >
          <select value={storeForm.siteId} onChange={(e) => setStoreForm({ ...storeForm, siteId: e.target.value })} className="input-admin">
            <option value="">Site</option>
            {sites.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} placeholder="Nom magasin" className="input-admin" />
          <input value={storeForm.odooLocationCode} onChange={(e) => setStoreForm({ ...storeForm, odooLocationCode: e.target.value })} placeholder="Code emplacement Odoo" className="input-admin md:col-span-2" />
          <button type="submit" className="md:col-span-2 bg-indigo-600 py-2 rounded-xl text-sm font-bold">Ajouter magasin</button>
        </form>
        <ul className="space-y-1 text-sm max-h-64 overflow-y-auto">
          {stores.filter((s) => s.active).map((s) => (
            <li key={s.id} className="flex justify-between bg-slate-900 rounded-lg px-3 py-2">
              <span>{s.name} {s.odooLocationCode && <span className="text-slate-500 text-[10px]">({s.odooLocationCode})</span>}</span>
              <button type="button" onClick={() => deleteStore(s.id)} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
