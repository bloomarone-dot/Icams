import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Key, ShieldAlert } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function DeskSetupPage() {
  const navigate = useNavigate()
  const { ready, profiles, settings, needsDeskSetup, setupDeskPassword } = useApp()
  const [profileId, setProfileId] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const admins = profiles.filter((p) => p.active && p.role === 'ADMIN')

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Chargement…
      </div>
    )
  }

  if (!needsDeskSetup) {
    return <Navigate to="/desk/login" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    const err = await setupDeskPassword(profileId || admins[0]?.id || '', password)
    if (err) {
      setError(err)
      return
    }
    navigate('/desk')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--icams-bg)' }}>
      {settings.theme.logoDataUrl ? (
        <img src={settings.theme.logoDataUrl} alt="Logo" className="h-16 mb-4 object-contain" />
      ) : (
        <ShieldAlert className="w-12 h-12 mb-4" style={{ color: 'var(--icams-accent)' }} />
      )}
      <h1 className="text-2xl font-black text-white mb-1">Configuration initiale</h1>
      <p className="text-slate-400 text-sm mb-8 text-center max-w-sm">
        Choisissez le mot de passe de l&apos;administrateur. Vous pourrez ensuite définir les mots de passe des autres profils.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        {admins.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Profil administrateur</label>
            <select
              value={profileId || admins[0]?.id || ''}
              onChange={(e) => setProfileId(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white"
            >
              {admins.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Votre mot de passe</label>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              placeholder="Minimum 4 caractères"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Confirmer le mot de passe</label>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={4}
              placeholder="Retapez le mot de passe"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm text-white"
            />
          </div>
        </div>

        {error && <p className="text-rose-400 text-xs bg-rose-950/40 border border-rose-900 rounded-lg p-2">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-xl font-bold text-sm text-white"
          style={{ backgroundColor: 'var(--icams-primary)' }}
        >
          Enregistrer et accéder au bureau
        </button>
      </form>

      <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 mt-6">← Retour accueil</Link>
    </div>
  )
}
