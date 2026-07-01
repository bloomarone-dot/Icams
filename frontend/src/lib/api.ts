import type {
  AppSettings,
  CountData,
  Entity,
  InventoryLine,
  Mission,
  MissionCadence,
  OdooSnapshot,
  Product,
  Profile,
  Site,
  Store,
  SyncQueueItem,
  Zone,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

export interface BootstrapData {
  zones: Zone[]
  sites: Site[]
  stores: Store[]
  entities: Entity[]
  products: Product[]
  profiles: Profile[]
  cadences: MissionCadence[]
  settings: AppSettings
  missions: Mission[]
  snapshots: OdooSnapshot[]
  lines: InventoryLine[]
  syncQueue: SyncQueueItem[]
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(text || res.statusText, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return false
    const data = await res.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}

export async function fetchBootstrap(): Promise<BootstrapData> {
  return request<BootstrapData>('/bootstrap')
}

export async function apiLoginMobile(profileId: string, password: string): Promise<string | null> {
  const res = await request<{ ok: boolean; error?: string }>('/auth/mobile', {
    method: 'POST',
    body: JSON.stringify({ profileId, password }),
  })
  return res.ok ? null : (res.error ?? 'Erreur de connexion')
}

export async function apiLoginDesk(profileId: string, password: string): Promise<string | null> {
  const res = await request<{ ok: boolean; error?: string }>('/auth/desk', {
    method: 'POST',
    body: JSON.stringify({ profileId, password }),
  })
  return res.ok ? null : (res.error ?? 'Erreur de connexion')
}

export async function apiSetupDesk(profileId: string, password: string): Promise<string | null> {
  const res = await request<{ ok: boolean; error?: string }>('/auth/desk/setup', {
    method: 'POST',
    body: JSON.stringify({ profileId, password }),
  })
  return res.ok ? null : (res.error ?? 'Erreur de configuration')
}

export async function apiUpdateSettings(settings: AppSettings): Promise<void> {
  await request('/settings', { method: 'PUT', body: JSON.stringify(settings) })
}

export async function apiSaveZone(z: Zone): Promise<void> {
  await request(`/zones/${z.id}`, { method: 'PUT', body: JSON.stringify(z) })
}

export async function apiDeleteZone(id: string): Promise<void> {
  await request(`/zones/${id}`, { method: 'DELETE' })
}

export async function apiSaveSite(s: Site): Promise<void> {
  await request(`/sites/${s.id}`, { method: 'PUT', body: JSON.stringify(s) })
}

export async function apiDeleteSite(id: string): Promise<void> {
  await request(`/sites/${id}`, { method: 'DELETE' })
}

export async function apiSaveStore(s: Store): Promise<void> {
  await request(`/stores/${s.id}`, { method: 'PUT', body: JSON.stringify(s) })
}

export async function apiDeleteStore(id: string): Promise<void> {
  await request(`/stores/${id}`, { method: 'DELETE' })
}

export async function apiSaveProduct(p: Product): Promise<void> {
  await request(`/products/${p.id}`, { method: 'PUT', body: JSON.stringify(p) })
}

export async function apiDeleteProduct(id: string): Promise<void> {
  await request(`/products/${id}`, { method: 'DELETE' })
}

export async function apiSaveProfile(p: Profile, plainPassword?: string): Promise<void> {
  const body = plainPassword ? { ...p, plainPassword } : p
  await request(`/profiles/${p.id}`, { method: 'PUT', body: JSON.stringify(body) })
}

export async function apiDeleteProfile(id: string): Promise<void> {
  await request(`/profiles/${id}`, { method: 'DELETE' })
}

export async function apiSaveCadence(c: MissionCadence): Promise<void> {
  await request(`/cadences/${c.id}`, { method: 'PUT', body: JSON.stringify(c) })
}

export async function apiDeleteCadence(id: string): Promise<void> {
  await request(`/cadences/${id}`, { method: 'DELETE' })
}

export async function apiImportSnapshot(snap: OdooSnapshot): Promise<void> {
  await request('/snapshots', { method: 'POST', body: JSON.stringify(snap) })
}

export async function apiCreateMission(
  m: Omit<Mission, 'id' | 'startedAt' | 'syncStatus' | 'controllerId'> & { controllerId?: string }
): Promise<Mission> {
  return request<Mission>('/missions', { method: 'POST', body: JSON.stringify(m) })
}

export async function apiUpdateMission(m: Mission): Promise<void> {
  await request(`/missions/${m.id}`, { method: 'PUT', body: JSON.stringify(m) })
}

export async function apiClaimMission(missionId: string, controllerId: string): Promise<void> {
  await request(`/missions/${missionId}/claim`, {
    method: 'POST',
    body: JSON.stringify({ controllerId }),
  })
}

export async function apiSaveInventoryLine(
  missionId: string,
  productId: string,
  countData: CountData,
  observation: string
): Promise<void> {
  await request('/inventory-lines', {
    method: 'PUT',
    body: JSON.stringify({ missionId, productId, countData, observation }),
  })
}

export async function apiSubmitMission(missionId: string): Promise<void> {
  await request(`/missions/${missionId}/submit`, { method: 'POST' })
}

export async function apiValidateMission(missionId: string): Promise<void> {
  await request(`/missions/${missionId}/validate`, { method: 'POST' })
}

export { ApiError }
