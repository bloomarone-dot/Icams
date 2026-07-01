import Dexie, { type Table } from 'dexie'
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
} from '../types'

export class IcamsDatabase extends Dexie {
  zones!: Table<Zone>
  sites!: Table<Site>
  stores!: Table<Store>
  entities!: Table<Entity>
  products!: Table<Product>
  profiles!: Table<Profile>
  missionCadences!: Table<MissionCadence>
  settings!: Table<AppSettings>
  odooSnapshots!: Table<OdooSnapshot>
  missions!: Table<Mission>
  inventoryLines!: Table<InventoryLine>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('icams')
    this.version(1).stores({
      zones: 'id, name, active',
      sites: 'id, zoneId, name, active',
      stores: 'id, siteId, name, active',
      entities: 'id, code, active',
      products: 'id, entityId, family, code, active',
      profiles: 'id, role, active',
      settings: 'id',
      odooSnapshots: 'id, storeId, importedAt',
      missions: 'id, storeId, entityId, status, controllerId',
      inventoryLines: 'id, missionId, productId',
      syncQueue: 'id, missionId, status, createdAt',
    })
    this.version(2).stores({
      zones: 'id, name, active',
      sites: 'id, zoneId, name, active',
      stores: 'id, siteId, name, active',
      entities: 'id, code, active',
      products: 'id, entityId, family, code, active',
      profiles: 'id, role, active',
      missionCadences: 'id, active, sortOrder',
      settings: 'id',
      odooSnapshots: 'id, storeId, importedAt',
      missions: 'id, storeId, entityId, status, controllerId, cadenceId',
      inventoryLines: 'id, missionId, productId',
      syncQueue: 'id, missionId, status, createdAt',
    })
  }
}

export const db = new IcamsDatabase()

export function uid(prefix = ''): string {
  return `${prefix}${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}
