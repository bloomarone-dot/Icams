import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function MobileLayout() {
  const { online, syncQueue } = useApp()
  const loc = useLocation()
  const pending = syncQueue.filter((q) => q.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loc.pathname !== '/mobile' && (
            <Link to=".." className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <span className="font-bold text-sm">ICAMS Terrain</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {online ? (
            <span className="flex items-center gap-1 text-emerald-400"><Wifi className="w-3.5 h-3.5" /> En ligne</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400"><WifiOff className="w-3.5 h-3.5" /> Hors ligne</span>
          )}
          {pending > 0 && <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">{pending} en attente</span>}
        </div>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
