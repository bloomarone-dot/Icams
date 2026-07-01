import { useState } from 'react'
import { Plus, Trash2, Key } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { uid } from '../../lib/db'
import type { UserRole } from '../../types'

export default function ProfilesAdminPage() {
  const { profiles, entities, saveProfile, deleteProfile } = useApp()
  const [form, setForm] = useState({
    name: '',
    role: 'CONTROLEUR' as UserRole,
    password: '',
    entityIds: [] as string[],
    zoneIds: [] as string[],
  })

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Profils utilisateurs</h1>
        <p className="text-sm text-slate-400">
          L&apos;administrateur définit le mot de passe de chaque profil. Seuls Direction et Admin accèdent au bureau.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!form.name || !form.password) return
          await saveProfile({
            id: uid('USR-'),
            name: form.name,
            role: form.role,
            entityIds: form.entityIds,
            zoneIds: form.zoneIds,
            passwordHash: '',
            active: true,
          }, form.password)
          setForm({ name: '', role: 'CONTROLEUR', password: '', entityIds: [], zoneIds: [] })
        }}
        className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4"
      >
        <h2 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Nouveau profil</h2>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" className="input-admin w-full" required />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="input-admin w-full">
          <option value="CONTROLEUR">Contrôleur terrain (mobile uniquement)</option>
          <option value="DIRECTION">Direction (bureau)</option>
          <option value="ADMIN">Administrateur (bureau + config)</option>
        </select>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Mot de passe (défini par l'admin)"
            className="input-admin w-full pl-10"
            required
            minLength={4}
          />
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Entités autorisées</p>
          <div className="flex flex-wrap gap-2">
            {entities.filter((e) => e.active).map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setForm({ ...form, entityIds: toggle(form.entityIds, e.id) })}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${form.entityIds.includes(e.id) ? 'text-white border-transparent' : 'border-slate-700'}`}
                style={form.entityIds.includes(e.id) ? { backgroundColor: 'var(--icams-primary)' } : undefined}
              >
                {e.code}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--icams-primary)' }}>
          Créer profil
        </button>
      </form>

      <div className="space-y-3">
        {profiles.filter((p) => p.active).map((p) => (
          <ProfileRow key={p.id} profile={p} entities={entities} onDelete={() => deleteProfile(p.id)} onSave={saveProfile} />
        ))}
      </div>
    </div>
  )
}

function ProfileRow({
  profile, entities, onDelete, onSave,
}: {
  profile: import('../../types').Profile
  entities: import('../../types').Entity[]
  onDelete: () => void
  onSave: (p: import('../../types').Profile, pw?: string) => Promise<void>
}) {
  const [newPassword, setNewPassword] = useState('')

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold">{profile.name}</p>
          <p className="text-xs text-slate-400">{profile.role}</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--icams-accent)' }}>
            {profile.entityIds.map((id) => entities.find((e) => e.id === id)?.code).join(', ')}
          </p>
        </div>
        <button type="button" onClick={onDelete} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nouveau mot de passe"
          className="input-admin flex-1 text-xs"
        />
        <button
          type="button"
          disabled={!newPassword}
          onClick={async () => { await onSave(profile, newPassword); setNewPassword('') }}
          className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: 'var(--icams-primary)' }}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  )
}
