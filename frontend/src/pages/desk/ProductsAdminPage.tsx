import { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { uid } from '../../lib/db'
import { formatMoney } from '../../lib/pricing'
import type { Product, ProductFamily } from '../../types'

export default function ProductsAdminPage() {
  const { products, entities, settings, saveProduct, deleteProduct } = useApp()
  const [filterEntity, setFilterEntity] = useState('')
  const [form, setForm] = useState<Partial<Product>>({ family: 'CIGARETTE', active: true })
  const [editId, setEditId] = useState<string | null>(null)

  const list = products.filter((p) => p.active && (!filterEntity || p.entityId === filterEntity))

  const packLabel = (f?: ProductFamily) => {
    if (f === 'CIGARETTE') return 'Prix / carton'
    if (f === 'GADGET') return 'Prix / balot'
    return 'Prix / carton'
  }

  const unitLabel = (f?: ProductFamily) => {
    if (f === 'CIGARETTE') return 'Prix / cartouche'
    if (f === 'GADGET') return 'Prix / unité'
    return 'Prix / pièce'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.entityId || !form.designation || !form.code) return
    const data: Product = {
      id: editId ?? uid('PRD-'),
      entityId: form.entityId,
      family: form.family as ProductFamily,
      code: form.code,
      designation: form.designation,
      brand: form.brand,
      packaging: form.packaging,
      odooProductCode: form.odooProductCode,
      unitPrice: form.unitPrice ? +form.unitPrice : undefined,
      packPrice: form.packPrice ? +form.packPrice : undefined,
      active: true,
    }
    await saveProduct(data)
    setForm({ family: 'CIGARETTE', active: true })
    setEditId(null)
  }

  const startEdit = (p: Product) => {
    setEditId(p.id)
    setForm(p)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Référentiel produits &amp; tarifs</h1>
        <p className="text-sm text-slate-400">
          Prix unitaire + prix par carton/balot. Les pertes sont calculées : cartons × prix carton + reste × prix unitaire.
        </p>
      </div>

      <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">
        <option value="">Toutes les entités</option>
        {entities.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.code}</option>)}
      </select>

      <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <h2 className="md:col-span-2 font-bold flex items-center gap-2">
          {editId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editId ? 'Modifier produit' : 'Nouveau produit'}
        </h2>
        <select required value={form.entityId ?? ''} onChange={(e) => setForm({ ...form, entityId: e.target.value })} className="input-admin">
          <option value="">Entité</option>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.code}</option>)}
        </select>
        <select value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value as ProductFamily })} className="input-admin">
          <option value="CIGARETTE">Cigarettes</option>
          <option value="GADGET">Gadgets</option>
          <option value="VAPE">Vapes</option>
        </select>
        <input required placeholder="Code" value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input-admin" />
        <input required placeholder="Désignation" value={form.designation ?? ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="input-admin" />
        <input type="number" min={0} placeholder={unitLabel(form.family as ProductFamily)} value={form.unitPrice ?? ''} onChange={(e) => setForm({ ...form, unitPrice: +e.target.value })} className="input-admin" />
        <input type="number" min={0} placeholder={packLabel(form.family as ProductFamily)} value={form.packPrice ?? ''} onChange={(e) => setForm({ ...form, packPrice: +e.target.value })} className="input-admin" />
        <input placeholder="Code Odoo" value={form.odooProductCode ?? ''} onChange={(e) => setForm({ ...form, odooProductCode: e.target.value })} className="input-admin md:col-span-2" />
        <button type="submit" className="md:col-span-2 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--icams-primary)' }}>
          {editId ? 'Enregistrer' : 'Ajouter'}
        </button>
      </form>

      <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th className="p-3">Produit</th>
              <th className="p-3">Entité</th>
              <th className="p-3 text-right">Prix unit.</th>
              <th className="p-3 text-right">Prix pack</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-slate-800/50">
                <td className="p-3">
                  <p className="font-bold">{p.designation}</p>
                  <p className="text-slate-500 font-mono">{p.code}</p>
                </td>
                <td className="p-3">{entities.find((e) => e.id === p.entityId)?.code} · {p.family}</td>
                <td className="p-3 text-right">{p.unitPrice ? formatMoney(p.unitPrice, settings.currency) : '—'}</td>
                <td className="p-3 text-right">{p.packPrice ? formatMoney(p.packPrice, settings.currency) : '—'}</td>
                <td className="p-3 flex gap-2">
                  <button type="button" onClick={() => startEdit(p)} className="text-indigo-400"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => deleteProduct(p.id)} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
