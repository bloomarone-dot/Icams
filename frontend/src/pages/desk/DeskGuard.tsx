import { Navigate, Outlet } from 'react-router-dom'
import { useApp, useDeskSession } from '../../context/AppContext'
import { canAccessDesk } from '../../types'

export default function DeskGuard() {
  const { ready, deskSessionId, profiles } = useApp()
  const session = useDeskSession()

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Chargement…
      </div>
    )
  }

  if (!deskSessionId || !session || !canAccessDesk(session.role)) {
    return <Navigate to="/desk/login" replace />
  }

  const profileStillValid = profiles.find((p) => p.id === deskSessionId && p.active)
  if (!profileStillValid) {
    return <Navigate to="/desk/login" replace />
  }

  return <Outlet />
}
