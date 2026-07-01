import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Lock, LogOut } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { hasPassword } from '../../lib/auth'

export default function MobileHome() {
  const { profiles, activeProfileId, loginMobile, logoutMobile, missions, stores, entities, cadences, claimMission } = useApp()
  const navigate = useNavigate()
  const [profileId, setProfileId] = useState(activeProfileId ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const profile = profiles.find((p) => p.id === activeProfileId)
  const controllers = profiles.filter((p) => p.active && p.role === 'CONTROLEUR' && hasPassword(p.passwordHash))

  const availableMissions = missions.filter((m) => {
    if (m.status === 'VALIDE' || m.status === 'EXPORTE') return false
    const assigned =
      m.assignedControllerIds.length === 0 ||
      (activeProfileId && m.assignedControllerIds.includes(activeProfileId))
    const mine = !m.controllerId || m.controllerId === activeProfileId
    return assigned && mine && (m.status === 'BROUILLON' || m.status === 'EN_COURS' || m.status === 'SOUMIS')
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const err = await loginMobile(profileId, password)
    if (err) setError(err)
    else setPassword('')
  }

  const openMission = async (missionId: string) => {
    if (!activeProfileId) return
    await claimMission(missionId, activeProfileId)
    navigate(`/mobile/mission/${missionId}`)
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-black">Connexion terrain</h1>
          <p className="text-xs text-slate-400">Identifiez-vous avec le mot de passe défini par l&apos;administrateur.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Profil contrôleur</label>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-sm"
            >
              <option value="">— Sélectionner —</option>
              {controllers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: 'var(--icams-primary)' }}>
            Se connecter
          </button>
          {controllers.length === 0 && (
            <p className="text-xs text-amber-400 text-center">
              Aucun contrôleur configuré. L&apos;administrateur doit créer un profil et définir son mot de passe depuis l&apos;interface bureau.
            </p>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Bonjour, {profile.name}</h1>
          <p className="text-xs text-slate-400">Missions assignées par la direction</p>
        </div>
        <button type="button" onClick={logoutMobile} className="text-slate-400 hover:text-white p-2" title="Déconnexion">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <ClipboardList className="w-4 h-4" style={{ color: 'var(--icams-accent)' }} />
          Missions à exécuter
        </h2>
        {availableMissions.length === 0 && (
          <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-900 rounded-xl p-4">
            Aucune mission disponible. La direction doit créer une mission depuis l&apos;interface bureau.
          </p>
        )}
        {availableMissions.map((m) => {
          const store = stores.find((s) => s.id === m.storeId)
          const ent = entities.find((e) => e.id === m.entityId)
          const cad = cadences.find((c) => c.id === m.cadenceId)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => openMission(m.id)}
              className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-600 transition-all"
            >
              <p className="font-bold text-sm">{m.name}</p>
              <p className="text-[10px] text-slate-400">{store?.name}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--icams-accent)' }}>
                {ent?.code} — {m.family} — {cad?.name} — {m.status}
              </p>
              {m.isPermanent && <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded-full mt-2 inline-block">Permanente</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
