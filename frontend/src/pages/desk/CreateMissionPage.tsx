import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Save } from 'lucide-react'
import { useApp, useDeskSession } from '../../context/AppContext'
import { familyLabel } from '../../data/seed'
import type { Mission, ProductFamily } from '../../types'

const EDITABLE_STATUSES = ['BROUILLON', 'EN_COURS'] as const

export default function CreateMissionPage() {
  const { missionId } = useParams<{ missionId: string }>()
  const isEdit = Boolean(missionId)
  const navigate = useNavigate()
  const {
    zones, sites, stores, entities, cadences, snapshots, profiles, missions,
    createMission, updateMission,
  } = useApp()
  const session = useDeskSession()

  const existing = isEdit ? missions.find((m) => m.id === missionId) : undefined

  const [name, setName] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [entityId, setEntityId] = useState('')
  const [family, setFamily] = useState<ProductFamily>('CIGARETTE')
  const [cadenceId, setCadenceId] = useState('')
  const [isPermanent, setIsPermanent] = useState(true)
  const [snapshotId, setSnapshotId] = useState('')
  const [controllerId, setControllerId] = useState('')
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [loaded, setLoaded] = useState(!isEdit)

  const controllers = profiles.filter((p) => p.active && p.role === 'CONTROLEUR')
  const filteredSites = sites.filter((s) => s.active && (!zoneId || s.zoneId === zoneId))
  const filteredStores = stores.filter((s) => s.active && (!siteId || s.siteId === siteId))
  const storeSnapshots = snapshots.filter((s) => s.storeId === storeId)

  useEffect(() => {
    if (!isEdit || !existing) return
    const store = stores.find((s) => s.id === existing.storeId)
    const site = store ? sites.find((si) => si.id === store.siteId) : undefined
    setName(existing.name)
    setZoneId(site?.zoneId ?? '')
    setSiteId(store?.siteId ?? '')
    setStoreId(existing.storeId)
    setEntityId(existing.entityId)
    setFamily(existing.family)
    setCadenceId(existing.cadenceId)
    setIsPermanent(existing.isPermanent)
    setSnapshotId(existing.snapshotId ?? '')
    setControllerId(existing.controllerId)
    setAssignedIds(existing.assignedControllerIds)
    setNotes(existing.notes ?? '')
    setLoaded(true)
  }, [isEdit, existing, stores, sites])

  const toggleAssign = (id: string) => {
    setAssignedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleControllerChange = (id: string) => {
    setControllerId(id)
    if (id) {
      setAssignedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !storeId || !entityId || !cadenceId) return

    const assignedControllerIds =
      assignedIds.length > 0
        ? assignedIds
        : controllerId
          ? [controllerId]
          : []

    const status =
      controllerId && (!isEdit || existing?.status === 'BROUILLON')
        ? 'EN_COURS'
        : existing?.status ?? 'BROUILLON'

    if (isEdit && existing) {
      await updateMission({
        ...existing,
        name,
        storeId,
        entityId,
        family,
        cadenceId,
        isPermanent,
        assignedControllerIds,
        controllerId,
        snapshotId: snapshotId || undefined,
        notes: notes || undefined,
        status,
      })
      navigate(`/desk/missions/${existing.id}`)
      return
    }

    const mission = await createMission({
      name,
      storeId,
      entityId,
      family,
      cadenceId,
      isPermanent,
      assignedControllerIds,
      controllerId: controllerId || undefined,
      snapshotId: snapshotId || undefined,
      status,
      createdByProfileId: session?.id,
      notes: notes || undefined,
    })
    navigate(`/desk/missions/${mission.id}`)
  }

  if (isEdit && !existing) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Mission introuvable.</p>
        <Link to="/desk/missions" className="text-sm text-indigo-400 hover:underline">Retour à la liste</Link>
      </div>
    )
  }

  if (isEdit && existing && !EDITABLE_STATUSES.includes(existing.status as (typeof EDITABLE_STATUSES)[number])) {
    return (
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-2xl font-black">Modification impossible</h1>
        <p className="text-sm text-slate-400">
          Cette mission est au statut <strong>{existing.status}</strong> et ne peut plus être modifiée.
        </p>
        <Link to={`/desk/missions/${existing.id}`} className="text-sm text-indigo-400 hover:underline">
          Voir la mission
        </Link>
      </div>
    )
  }

  if (!loaded) return <p className="text-slate-400">Chargement…</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black">{isEdit ? 'Modifier la mission' : 'Créer une mission'}</h1>
        <p className="text-sm text-slate-400">
          {isEdit
            ? 'Mettez à jour les paramètres tant que la mission n\'est pas soumise.'
            : 'Définissez une mission permanente ou ponctuelle et assignez un contrôleur.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
        <Field label="Libellé de la mission">
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Inventaire mensuel AFKOT Douala" className="input-admin" />
        </Field>

        <Field label="Contrôleur assigné">
          <select
            value={controllerId}
            onChange={(e) => handleControllerChange(e.target.value)}
            className="input-admin"
          >
            <option value="">— Non assigné —</option>
            {controllers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1">
            La personne verra la mission directement sur son interface mobile.
          </p>
        </Field>

        <Field label="Fréquence (cadence)">
          <select value={cadenceId} onChange={(e) => setCadenceId(e.target.value)} required className="input-admin">
            <option value="">— Choisir —</option>
            {cadences.filter((c) => c.active).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.intervalDays} j) — {c.description}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={isPermanent} onChange={(e) => setIsPermanent(e.target.checked)} />
          Mission permanente (se réinitialise après validation pour le prochain cycle)
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Zone">
            <select value={zoneId} onChange={(e) => { setZoneId(e.target.value); setSiteId(''); setStoreId('') }} className="input-admin">
              <option value="">Toutes</option>
              {zones.filter((z) => z.active).map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </Field>
          <Field label="Site / Ville">
            <select value={siteId} onChange={(e) => { setSiteId(e.target.value); setStoreId('') }} className="input-admin" required>
              <option value="">— Choisir —</option>
              {filteredSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Magasin">
          <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setSnapshotId('') }} required className="input-admin">
            <option value="">— Choisir —</option>
            {filteredStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="Entité">
          <div className="grid grid-cols-3 gap-2">
            {entities.filter((e) => e.active).map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEntityId(e.id)}
                className={`py-2 rounded-xl text-xs font-bold border ${entityId === e.id ? 'text-white border-transparent' : 'border-slate-700 bg-slate-900'}`}
                style={entityId === e.id ? { backgroundColor: 'var(--icams-primary)' } : undefined}
              >
                {e.code}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Famille de produits">
          <select value={family} onChange={(e) => setFamily(e.target.value as ProductFamily)} className="input-admin">
            <option value="CIGARETTE">{familyLabel('CIGARETTE')}</option>
            <option value="GADGET">{familyLabel('GADGET')}</option>
            <option value="VAPE">{familyLabel('VAPE')}</option>
          </select>
        </Field>

        {storeId && (
          <Field label="Snapshot Odoo (stock système)">
            <select value={snapshotId} onChange={(e) => setSnapshotId(e.target.value)} className="input-admin">
              <option value="">Aucun (à importer plus tard)</option>
              {storeSnapshots.map((s) => (
                <option key={s.id} value={s.id}>{s.fileName} — {new Date(s.importedAt).toLocaleDateString()}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Autres contrôleurs autorisés (optionnel)">
          <div className="flex flex-wrap gap-2">
            {controllers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleAssign(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${assignedIds.includes(c.id) ? 'text-white border-transparent' : 'border-slate-700'}`}
                style={assignedIds.includes(c.id) ? { backgroundColor: 'var(--icams-primary)' } : undefined}
              >
                {c.name}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Laissez vide pour autoriser tous les contrôleurs, ou sélectionnez des profils supplémentaires.
          </p>
        </Field>

        <Field label="Notes internes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-admin" />
        </Field>

        <div className="flex gap-3">
          <Link
            to={isEdit ? `/desk/missions/${missionId}` : '/desk/missions'}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-center border border-slate-700 hover:bg-slate-900"
          >
            Annuler
          </Link>
          <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--icams-primary)' }}>
            {isEdit ? <><Save className="w-4 h-4" /> Enregistrer</> : <><Plus className="w-4 h-4" /> Créer la mission</>}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-300">{label}</label>
      {children}
    </div>
  )
}

export function canEditMission(m: Mission): boolean {
  return EDITABLE_STATUSES.includes(m.status as (typeof EDITABLE_STATUSES)[number])
}
