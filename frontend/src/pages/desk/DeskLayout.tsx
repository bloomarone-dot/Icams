import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Upload, Package, MapPin, Users, Settings, Home, Calendar, LogOut,
} from 'lucide-react'
import { useApp, useDeskSession } from '../../context/AppContext'

const NAV = [
  { to: '/desk', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/desk/missions', label: 'Missions', icon: ClipboardList },
  { to: '/desk/odoo', label: 'Import Odoo', icon: Upload },
  { to: '/desk/admin/products', label: 'Produits', icon: Package },
  { to: '/desk/admin/stores', label: 'Magasins', icon: MapPin },
  { to: '/desk/admin/profiles', label: 'Profils', icon: Users },
  { to: '/desk/admin/cadences', label: 'Cadences', icon: Calendar },
  { to: '/desk/admin/settings', label: 'Paramètres', icon: Settings },
]

export default function DeskLayout() {
  const loc = useLocation()
  const navigate = useNavigate()
  const { settings, online, logoutDesk } = useApp()
  const session = useDeskSession()

  const handleLogout = () => {
    logoutDesk()
    navigate('/desk/login')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <aside className="w-60 bg-slate-950 border-r border-slate-800 p-4 hidden lg:flex flex-col gap-6">
        <div className="flex items-center gap-2 px-2">
          {settings.theme.logoDataUrl ? (
            <img src={settings.theme.logoDataUrl} alt="" className="h-8 w-8 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: 'var(--icams-primary)' }} />
          )}
          <div>
            <p className="font-black text-sm">ICAMS</p>
            <p className="text-[10px] text-slate-500">{session?.name}</p>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map(({ to, label, icon: Icon, end }) => {
            const active = end ? loc.pathname === to : loc.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${active ? 'text-white' : 'text-slate-400 hover:bg-slate-900'}`}
                style={active ? { backgroundColor: 'var(--icams-primary)' } : undefined}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            )
          })}
        </nav>
        <button type="button" onClick={handleLogout} className="flex items-center gap-2 text-xs text-slate-500 hover:text-rose-400 px-2">
          <LogOut className="w-3.5 h-3.5" /> Déconnexion
        </button>
        <Link to="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 px-2">
          <Home className="w-3.5 h-3.5" /> Accueil ICAMS
        </Link>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold">{settings.companyName}</p>
            <p className="text-xs text-slate-500">{online ? 'Connecté' : 'Mode hors ligne — données locales'}</p>
          </div>
          <button type="button" onClick={handleLogout} className="lg:hidden text-xs text-slate-400 flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Quitter
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
