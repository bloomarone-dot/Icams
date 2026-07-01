import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, mergeSettings } from '../lib/settings'
import { db, uid } from '../lib/db'
import { buildSeedData } from '../data/seed'
import { computePhysicalQty } from '../lib/conversions'
import { computeEcartValue } from '../lib/pricing'
import { verifyPassword, hashPassword, hasPassword } from '../lib/auth'
import { applyTheme } from '../lib/theme'
import {
  checkApiHealth,
  fetchBootstrap,
  apiLoginMobile,
  apiLoginDesk,
  apiSetupDesk,
  apiUpdateSettings,
  apiSaveZone,
  apiDeleteZone,
  apiSaveSite,
  apiDeleteSite,
  apiSaveStore,
  apiDeleteStore,
  apiSaveProduct,
  apiDeleteProduct,
  apiSaveProfile,
  apiDeleteProfile,
  apiSaveCadence,
  apiDeleteCadence,
  apiImportSnapshot,
  apiCreateMission,
  apiUpdateMission,
  apiClaimMission,
  apiSaveInventoryLine,
  apiSubmitMission,
  apiValidateMission,
} from '../lib/api'
import { syncBootstrapToCache } from '../lib/syncCache'
import type {
  AppSettings,
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
  CountData,
} from '../types'
import { canAccessDesk } from '../types'

interface AppState {
  ready: boolean
  online: boolean
  apiConnected: boolean
  settings: AppSettings
  zones: Zone[]
  sites: Site[]
  stores: Store[]
  entities: Entity[]
  products: Product[]
  profiles: Profile[]
  cadences: MissionCadence[]
  missions: Mission[]
  snapshots: OdooSnapshot[]
  lines: InventoryLine[]
  syncQueue: SyncQueueItem[]
  activeProfileId: string | null
  deskSessionId: string | null
  needsDeskSetup: boolean
  refresh: () => Promise<void>
  loginMobile: (profileId: string, password: string) => Promise<string | null>
  loginDesk: (profileId: string, password: string) => Promise<string | null>
  setupDeskPassword: (profileId: string, password: string) => Promise<string | null>
  logoutMobile: () => void
  logoutDesk: () => void
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  saveZone: (z: Zone) => Promise<void>
  deleteZone: (id: string) => Promise<void>
  saveSite: (s: Site) => Promise<void>
  deleteSite: (id: string) => Promise<void>
  saveStore: (s: Store) => Promise<void>
  deleteStore: (id: string) => Promise<void>
  saveProduct: (p: Product) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  saveProfile: (p: Profile, plainPassword?: string) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  saveCadence: (c: MissionCadence) => Promise<void>
  deleteCadence: (id: string) => Promise<void>
  importSnapshot: (snap: OdooSnapshot) => Promise<void>
  createMission: (m: Omit<Mission, 'id' | 'startedAt' | 'syncStatus' | 'controllerId'> & { controllerId?: string }) => Promise<Mission>
  updateMission: (m: Mission) => Promise<void>
  claimMission: (missionId: string, controllerId: string) => Promise<void>
  saveInventoryLine: (missionId: string, productId: string, countData: CountData, observation: string) => Promise<void>
  submitMission: (missionId: string) => Promise<void>
  validateMission: (missionId: string) => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

function applyBootstrapToState(
  data: Awaited<ReturnType<typeof fetchBootstrap>>,
  setters: {
    setZones: (v: Zone[]) => void
    setSites: (v: Site[]) => void
    setStores: (v: Store[]) => void
    setEntities: (v: Entity[]) => void
    setProducts: (v: Product[]) => void
    setProfiles: (v: Profile[]) => void
    setCadences: (v: MissionCadence[]) => void
    setMissions: (v: Mission[]) => void
    setSnapshots: (v: OdooSnapshot[]) => void
    setLines: (v: InventoryLine[]) => void
    setSyncQueue: (v: SyncQueueItem[]) => void
    setSettings: (v: AppSettings) => void
  }
) {
  setters.setZones(data.zones)
  setters.setSites(data.sites)
  setters.setStores(data.stores)
  setters.setEntities(data.entities)
  setters.setProducts(data.products)
  setters.setProfiles(data.profiles)
  setters.setCadences(data.cadences.sort((a, b) => a.sortOrder - b.sortOrder))
  setters.setMissions(data.missions)
  setters.setSnapshots(data.snapshots)
  setters.setLines(data.lines)
  setters.setSyncQueue(data.syncQueue)
  const merged = mergeSettings(data.settings)
  setters.setSettings(merged)
  applyTheme(merged.theme)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [apiConnected, setApiConnected] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [zones, setZones] = useState<Zone[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [cadences, setCadences] = useState<MissionCadence[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [snapshots, setSnapshots] = useState<OdooSnapshot[]>([])
  const [lines, setLines] = useState<InventoryLine[]>([])
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(
    () => localStorage.getItem('icams_profile') || null
  )
  const [deskSessionId, setDeskSessionId] = useState<string | null>(
    () => localStorage.getItem('icams_desk_session') || null
  )

  const stateSetters = useMemo(
    () => ({
      setZones, setSites, setStores, setEntities, setProducts, setProfiles,
      setCadences, setMissions, setSnapshots, setLines, setSyncQueue, setSettings,
    }),
    []
  )

  const refreshLocal = useCallback(async () => {
    const [z, si, st, e, p, pr, cad, m, sn, ln, sq, sett] = await Promise.all([
      db.zones.toArray(),
      db.sites.toArray(),
      db.stores.toArray(),
      db.entities.toArray(),
      db.products.toArray(),
      db.profiles.toArray(),
      db.missionCadences.toArray(),
      db.missions.toArray(),
      db.odooSnapshots.toArray(),
      db.inventoryLines.toArray(),
      db.syncQueue.toArray(),
      db.settings.get('global'),
    ])
    setZones(z)
    setSites(si)
    setStores(st)
    setEntities(e)
    setProducts(p)
    setProfiles(pr)
    setCadences(cad.sort((a, b) => a.sortOrder - b.sortOrder))
    setMissions(m)
    setSnapshots(sn)
    setLines(ln)
    setSyncQueue(sq)
    const merged = mergeSettings(sett ?? {})
    setSettings(merged)
    applyTheme(merged.theme)
  }, [])

  const refreshFromApi = useCallback(async () => {
    const data = await fetchBootstrap()
    await syncBootstrapToCache(data)
    applyBootstrapToState(data, stateSetters)
  }, [stateSetters])

  const refresh = useCallback(async () => {
    if (apiConnected && navigator.onLine) {
      try {
        await refreshFromApi()
        return
      } catch {
        /* repli sur le cache local */
      }
    }
    await refreshLocal()
  }, [apiConnected, refreshFromApi, refreshLocal])

  const useServer = useCallback(() => apiConnected && navigator.onLine, [apiConnected])

  useEffect(() => {
    const init = async () => {
      const connected = await checkApiHealth()
      setApiConnected(connected)

      if (connected && navigator.onLine) {
        try {
          const data = await fetchBootstrap()
          await syncBootstrapToCache(data)
          applyBootstrapToState(data, stateSetters)
          setReady(true)
          return
        } catch {
          setApiConnected(false)
        }
      }

      const count = await db.zones.count()
      if (count === 0) {
        const seed = await buildSeedData()
        await db.transaction('rw', db.tables, async () => {
          await db.zones.bulkAdd(seed.zones)
          await db.sites.bulkAdd(seed.sites)
          await db.stores.bulkAdd(seed.stores)
          await db.entities.bulkAdd(seed.entities)
          await db.products.bulkAdd(seed.products)
          await db.profiles.bulkAdd(seed.profiles)
          await db.missionCadences.bulkAdd(seed.cadences)
          await db.settings.put(DEFAULT_SETTINGS)
        })
      } else {
        const cadCount = await db.missionCadences.count()
        if (cadCount === 0) {
          const seed = await buildSeedData()
          await db.missionCadences.bulkAdd(seed.cadences)
        }
        const allProfiles = await db.profiles.toArray()
        const sett = await db.settings.get('global')
        const mergedSett = mergeSettings(sett ?? {})
        if ((mergedSett.authSetupVersion ?? 0) < 1) {
          for (const p of allProfiles) {
            await db.profiles.update(p.id, { passwordHash: '' })
          }
          await db.settings.put({ ...mergedSett, authSetupVersion: 1 })
        }
        if (sett && !sett.theme) {
          await db.settings.put(mergeSettings(sett))
        }
        const allMissions = await db.missions.toArray()
        const defaultCadence = (await db.missionCadences.orderBy('sortOrder').first())?.id ?? ''
        for (const m of allMissions) {
          const patch: Partial<Mission> = {}
          if (!m.name) {
            const store = await db.stores.get(m.storeId)
            patch.name = `Mission ${store?.name ?? m.id}`
          }
          if (!m.cadenceId && defaultCadence) patch.cadenceId = defaultCadence
          if (m.isPermanent === undefined) patch.isPermanent = false
          if (!m.assignedControllerIds) patch.assignedControllerIds = m.controllerId ? [m.controllerId] : []
          if (Object.keys(patch).length) await db.missions.update(m.id, patch)
        }
        const allLines = await db.inventoryLines.toArray()
        const mergedSettings = mergeSettings((await db.settings.get('global')) ?? {})
        for (const l of allLines) {
          if (l.ecartValue !== undefined && l.ecartValue !== null) continue
          const mission = await db.missions.get(l.missionId)
          const product = await db.products.get(l.productId)
          if (!mission || !product) continue
          const ecartValue = computeEcartValue(l.ecart, product, mission.family, mergedSettings)
          await db.inventoryLines.update(l.id, { ecartValue })
        }
      }
      await refreshLocal()
      setReady(true)
    }
    init()

    const onOnline = async () => {
      setOnline(true)
      const connected = await checkApiHealth()
      setApiConnected(connected)
      if (connected) await refresh()
    }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [refresh, refreshLocal, stateSetters])

  const loginMobile = async (profileId: string, password: string) => {
    if (useServer()) {
      const err = await apiLoginMobile(profileId, password)
      if (err) return err
    } else {
      const profile = await db.profiles.get(profileId)
      if (!profile || !profile.active) return 'Profil introuvable'
      if (!hasPassword(profile.passwordHash)) return 'Mot de passe non configuré — demandez à l\'administrateur'
      if (!(await verifyPassword(password, profile.passwordHash))) return 'Mot de passe incorrect'
    }
    setActiveProfileId(profileId)
    localStorage.setItem('icams_profile', profileId)
    return null
  }

  const loginDesk = async (profileId: string, password: string) => {
    if (useServer()) {
      const err = await apiLoginDesk(profileId, password)
      if (err) return err
    } else {
      const profile = await db.profiles.get(profileId)
      if (!profile || !profile.active) return 'Profil introuvable'
      if (!canAccessDesk(profile.role)) return 'Accès bureau réservé à la Direction et Admin'
      if (!hasPassword(profile.passwordHash)) return 'Mot de passe non configuré — contactez l\'administrateur'
      if (!(await verifyPassword(password, profile.passwordHash))) return 'Mot de passe incorrect'
    }
    setDeskSessionId(profileId)
    localStorage.setItem('icams_desk_session', profileId)
    return null
  }

  const setupDeskPassword = async (profileId: string, password: string) => {
    if (password.length < 4) return 'Mot de passe trop court (4 caractères minimum)'

    if (useServer()) {
      const err = await apiSetupDesk(profileId, password)
      if (err) return err
    } else {
      const profile = await db.profiles.get(profileId)
      if (!profile || !profile.active) return 'Profil introuvable'
      if (profile.role !== 'ADMIN') return 'Seul un administrateur peut effectuer la configuration initiale'
      const passwordHash = await hashPassword(password)
      await db.profiles.put({ ...profile, passwordHash })
    }
    setDeskSessionId(profileId)
    localStorage.setItem('icams_desk_session', profileId)
    await refresh()
    return null
  }

  const logoutMobile = () => {
    setActiveProfileId(null)
    localStorage.removeItem('icams_profile')
  }

  const logoutDesk = () => {
    setDeskSessionId(null)
    localStorage.removeItem('icams_desk_session')
  }

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const next = mergeSettings({ ...settings, ...partial })
    if (useServer()) {
      await apiUpdateSettings(next)
    } else {
      await db.settings.put(next)
    }
    setSettings(next)
    applyTheme(next.theme)
    await refresh()
  }

  const saveZone = async (z: Zone) => {
    if (useServer()) await apiSaveZone(z)
    else await db.zones.put(z)
    await refresh()
  }
  const deleteZone = async (id: string) => {
    if (useServer()) await apiDeleteZone(id)
    else await db.zones.update(id, { active: false })
    await refresh()
  }
  const saveSite = async (s: Site) => {
    if (useServer()) await apiSaveSite(s)
    else await db.sites.put(s)
    await refresh()
  }
  const deleteSite = async (id: string) => {
    if (useServer()) await apiDeleteSite(id)
    else await db.sites.update(id, { active: false })
    await refresh()
  }
  const saveStore = async (s: Store) => {
    if (useServer()) await apiSaveStore(s)
    else await db.stores.put(s)
    await refresh()
  }
  const deleteStore = async (id: string) => {
    if (useServer()) await apiDeleteStore(id)
    else await db.stores.update(id, { active: false })
    await refresh()
  }
  const saveProduct = async (p: Product) => {
    if (useServer()) await apiSaveProduct(p)
    else await db.products.put(p)
    await refresh()
  }
  const deleteProduct = async (id: string) => {
    if (useServer()) await apiDeleteProduct(id)
    else await db.products.update(id, { active: false })
    await refresh()
  }

  const saveProfile = async (p: Profile, plainPassword?: string) => {
    if (useServer()) {
      await apiSaveProfile(p, plainPassword)
    } else {
      let passwordHash = p.passwordHash
      if (plainPassword) passwordHash = await hashPassword(plainPassword)
      await db.profiles.put({ ...p, passwordHash })
    }
    await refresh()
  }

  const deleteProfile = async (id: string) => {
    if (useServer()) await apiDeleteProfile(id)
    else await db.profiles.update(id, { active: false })
    await refresh()
  }
  const saveCadence = async (c: MissionCadence) => {
    if (useServer()) await apiSaveCadence(c)
    else await db.missionCadences.put(c)
    await refresh()
  }
  const deleteCadence = async (id: string) => {
    if (useServer()) await apiDeleteCadence(id)
    else await db.missionCadences.update(id, { active: false })
    await refresh()
  }
  const importSnapshot = async (snap: OdooSnapshot) => {
    if (useServer()) await apiImportSnapshot(snap)
    else await db.odooSnapshots.put(snap)
    await refresh()
  }

  const createMission = async (
    m: Omit<Mission, 'id' | 'startedAt' | 'syncStatus' | 'controllerId'> & { controllerId?: string }
  ) => {
    if (useServer()) {
      const mission = await apiCreateMission(m)
      await refresh()
      return mission
    }
    const cadence = await db.missionCadences.get(m.cadenceId)
    const nextDue = cadence
      ? new Date(Date.now() + cadence.intervalDays * 86400000).toISOString().split('T')[0]
      : undefined
    const mission: Mission = {
      ...m,
      controllerId: m.controllerId ?? '',
      id: uid('MISS-'),
      startedAt: new Date().toISOString(),
      syncStatus: 'LOCAL',
      nextDueDate: nextDue,
    }
    await db.missions.add(mission)
    await refresh()
    return mission
  }

  const updateMission = async (m: Mission) => {
    if (useServer()) await apiUpdateMission(m)
    else await db.missions.put(m)
    await refresh()
  }

  const claimMission = async (missionId: string, controllerId: string) => {
    if (useServer()) {
      await apiClaimMission(missionId, controllerId)
    } else {
      const mission = await db.missions.get(missionId)
      if (!mission) return
      await db.missions.put({
        ...mission,
        controllerId,
        status: mission.status === 'BROUILLON' ? 'EN_COURS' : mission.status,
      })
    }
    await refresh()
  }

  const saveInventoryLine = async (
    missionId: string,
    productId: string,
    countData: CountData,
    observation: string
  ) => {
    if (useServer()) {
      await apiSaveInventoryLine(missionId, productId, countData, observation)
      await refresh()
      return
    }

    const mission = await db.missions.get(missionId)
    const product = await db.products.get(productId)
    if (!mission || !product) return

    let systemQty = 0
    if (mission.snapshotId) {
      const snap = await db.odooSnapshots.get(mission.snapshotId)
      systemQty = snap?.lines.find((l) => l.productId === productId)?.systemQty ?? 0
    }

    const { physicalQty, avarieQty } = computePhysicalQty(mission.family, countData, settings)
    const ecart = physicalQty - systemQty
    const ecartValue = computeEcartValue(ecart, product, mission.family, settings)

    const allLines = await db.inventoryLines.where('missionId').equals(missionId).toArray()
    const existing = allLines.find((l) => l.productId === productId)
    const row: InventoryLine = {
      id: existing?.id ?? uid('LINE-'),
      missionId,
      productId,
      countData,
      physicalQty,
      systemQty,
      ecart,
      avarieQty,
      ecartValue,
      observation,
      updatedAt: new Date().toISOString(),
    }
    await db.inventoryLines.put(row)
    if (mission.status === 'BROUILLON') {
      await db.missions.update(missionId, { status: 'EN_COURS' })
    }
    await refresh()
  }

  const submitMission = async (missionId: string) => {
    if (useServer()) {
      await apiSubmitMission(missionId)
    } else {
      const mission = await db.missions.get(missionId)
      if (!mission) return
      await db.missions.put({
        ...mission,
        status: 'SOUMIS',
        syncStatus: navigator.onLine ? 'PENDING' : 'LOCAL',
        submittedAt: new Date().toISOString(),
      })
      await db.syncQueue.add({
        id: uid('SYNC-'),
        missionId,
        payload: JSON.stringify(mission),
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'PENDING',
      })
    }
    await refresh()
  }

  const validateMission = async (missionId: string) => {
    if (useServer()) {
      await apiValidateMission(missionId)
    } else {
      const mission = await db.missions.get(missionId)
      if (!mission) return
      const cadence = await db.missionCadences.get(mission.cadenceId)

      if (mission.isPermanent) {
        await db.inventoryLines.where('missionId').equals(missionId).delete()
        const nextDue = cadence
          ? new Date(Date.now() + cadence.intervalDays * 86400000).toISOString().split('T')[0]
          : undefined
        await db.missions.put({
          ...mission,
          status: 'BROUILLON',
          controllerId: '',
          submittedAt: undefined,
          syncStatus: 'LOCAL',
          nextDueDate: nextDue,
        })
      } else {
        await db.missions.put({ ...mission, status: 'VALIDE' })
      }
    }
    await refresh()
  }

  const needsDeskSetup = useMemo(() => {
    const admins = profiles.filter((p) => p.active && p.role === 'ADMIN')
    return admins.length > 0 && admins.every((p) => !hasPassword(p.passwordHash))
  }, [profiles])

  const value = useMemo(
    () => ({
      ready, online, apiConnected, settings, zones, sites, stores, entities, products, profiles, cadences,
      missions, snapshots, lines, syncQueue, activeProfileId, deskSessionId, needsDeskSetup,
      refresh, loginMobile, loginDesk, setupDeskPassword, logoutMobile, logoutDesk, updateSettings,
      saveZone, deleteZone, saveSite, deleteSite, saveStore, deleteStore,
      saveProduct, deleteProduct, saveProfile, deleteProfile, saveCadence, deleteCadence,
      importSnapshot, createMission, updateMission, claimMission,
      saveInventoryLine, submitMission, validateMission,
    }),
    [ready, online, apiConnected, settings, zones, sites, stores, entities, products, profiles, cadences,
      missions, snapshots, lines, syncQueue, activeProfileId, deskSessionId, needsDeskSetup, refresh]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp hors AppProvider')
  return ctx
}

export function useDeskSession(): Profile | undefined {
  const { profiles, deskSessionId } = useApp()
  return profiles.find((p) => p.id === deskSessionId)
}
