import { Link } from 'react-router-dom'
import { Smartphone, Monitor, ShieldAlert } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function HomePage() {
  const { settings, needsDeskSetup, apiConnected, online } = useApp()

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--icams-bg)' }}>
      {settings.theme.logoDataUrl ? (
        <img src={settings.theme.logoDataUrl} alt="Logo" className="h-20 mb-4 object-contain" />
      ) : (
        <ShieldAlert className="w-10 h-10 mb-2" style={{ color: 'var(--icams-accent)' }} />
      )}
      <h1 className="text-3xl font-black tracking-tight">ICAMS</h1>
      <p className="text-slate-400 text-sm mb-2 text-center max-w-md">
        {settings.companyName}
      </p>
      <p className={`text-xs mb-10 ${apiConnected && online ? 'text-emerald-400' : 'text-amber-400'}`}>
        {apiConnected && online ? '● Connecté au serveur' : online ? '● Mode local (serveur indisponible)' : '● Hors ligne — cache local'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <Link
          to="/mobile"
          className="rounded-2xl p-8 flex flex-col items-center gap-3 transition-all shadow-lg text-white"
          style={{ backgroundColor: 'var(--icams-primary)' }}
        >
          <Smartphone className="w-10 h-10" />
          <span className="font-bold text-lg">Interface Terrain</span>
          <span className="text-xs text-center opacity-80">Contrôleurs mobiles — inventaire hors ligne</span>
        </Link>
        <Link
          to={needsDeskSetup ? '/desk/setup' : '/desk/login'}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col items-center gap-3 transition-all"
        >
          <Monitor className="w-10 h-10" style={{ color: 'var(--icams-accent)' }} />
          <span className="font-bold text-lg">Interface Bureau</span>
          <span className="text-slate-400 text-xs text-center">
            {needsDeskSetup ? 'Première configuration — choisissez votre mot de passe' : 'Mot de passe requis — Direction & Admin'}
          </span>
        </Link>
      </div>
    </div>
  )
}
