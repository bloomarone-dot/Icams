import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import HomePage from './pages/HomePage'
import MobileLayout from './pages/mobile/MobileLayout'
import MobileHome from './pages/mobile/MobileHome'
import MissionDetailPage from './pages/mobile/MissionDetailPage'
import ProductCountPage from './pages/mobile/ProductCountPage'
import DeskGuard from './pages/desk/DeskGuard'
import DeskLoginPage from './pages/desk/DeskLoginPage'
import DeskSetupPage from './pages/desk/DeskSetupPage'
import DeskLayout from './pages/desk/DeskLayout'
import DeskDashboard from './pages/desk/DeskDashboard'
import MissionsListPage from './pages/desk/MissionsListPage'
import CreateMissionPage from './pages/desk/CreateMissionPage'
import MissionReconPage from './pages/desk/MissionReconPage'
import OdooImportPage from './pages/desk/OdooImportPage'
import ProductsAdminPage from './pages/desk/ProductsAdminPage'
import StoresAdminPage from './pages/desk/StoresAdminPage'
import ProfilesAdminPage from './pages/desk/ProfilesAdminPage'
import CadencesAdminPage from './pages/desk/CadencesAdminPage'
import SettingsPage from './pages/desk/SettingsPage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mobile" element={<MobileLayout />}>
            <Route index element={<MobileHome />} />
            <Route path="mission/:missionId" element={<MissionDetailPage />} />
            <Route path="mission/:missionId/product/:productId" element={<ProductCountPage />} />
          </Route>
          <Route path="/desk/setup" element={<DeskSetupPage />} />
          <Route path="/desk/login" element={<DeskLoginPage />} />
          <Route path="/desk" element={<DeskGuard />}>
            <Route element={<DeskLayout />}>
              <Route index element={<DeskDashboard />} />
              <Route path="missions" element={<MissionsListPage />} />
              <Route path="missions/new" element={<CreateMissionPage />} />
              <Route path="missions/:missionId/edit" element={<CreateMissionPage />} />
              <Route path="missions/:missionId" element={<MissionReconPage />} />
              <Route path="odoo" element={<OdooImportPage />} />
              <Route path="admin/products" element={<ProductsAdminPage />} />
              <Route path="admin/stores" element={<StoresAdminPage />} />
              <Route path="admin/profiles" element={<ProfilesAdminPage />} />
              <Route path="admin/cadences" element={<CadencesAdminPage />} />
              <Route path="admin/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
