import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Lock, Monitor, ShieldAlert } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { canAccessDesk } from '../../types'
import { hasPassword } from '../../lib/auth'

export default function DeskLoginPage() {
  const navigate = useNavigate()
  const { ready, profiles, settings, needsDeskSetup, loginDesk } = useApp()
  const [profileId, setProfileId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const deskProfiles = profiles.filter((p) => p.active && canAccessDesk(p.role) && hasPassword(p.passwordHash))

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Chargement…
      </div>
    )
  }

  if (needsDeskSetup) {
    return <Navigate to="/desk/setup" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const err = await loginDesk(profileId, password)
    if (err) setError(err)
    else navigate('/desk')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--icams-bg)' }}>
      {settings.theme.logoDataUrl ? (
        <img src={settings.theme.logoDataUrl} alt="Logo" className="h-16 mb-4 object-contain" />
      ) : (
        <ShieldAlert className="w-12 h-12 mb-4" style={{ color: 'var(--icams-accent)' }} />
      )}
      <h1 className="text-2xl font-black text-white mb-1">Interface Bureau</h1>
      <p className="text-slate-400 text-sm mb-8 text-center">Accès réservé Direction &amp; Administrateur</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
          <Monitor className="w-4 h-4" style={{ color: 'var(--icams-accent)' }} />
          Connexion sécurisée
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Profil</label>
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white"
          >
            <option value="">— Sélectionner —</option>
            {deskProfiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
            ))}
          </select>
          {deskProfiles.length === 0 && (
            <p className="text-xs text-amber-400">Aucun profil bureau configuré. L&apos;administrateur doit définir les mots de passe dans Profils.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Mot de passe</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Votre mot de passe"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm text-white"
            />
          </div>
        </div>

        {error && <p className="text-rose-400 text-xs bg-rose-950/40 border border-rose-900 rounded-lg p-2">{error}</p>}

        <button
          type="submit"
          disabled={deskProfiles.length === 0}
          className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40"
          style={{ backgroundColor: 'var(--icams-primary)' }}
        >
          Accéder au bureau
        </button>
      </form>

      <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 mt-6">← Retour accueil</Link>
    </div>
  )
}
