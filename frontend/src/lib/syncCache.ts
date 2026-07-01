import { db } from './db'
import type { BootstrapData } from './api'

/** Synchronise les données serveur dans le cache IndexedDB local (mode hors ligne). */
export async function syncBootstrapToCache(data: BootstrapData): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await db.zones.clear()
    await db.sites.clear()
    await db.stores.clear()
    await db.entities.clear()
    await db.products.clear()
    await db.profiles.clear()
    await db.missionCadences.clear()
    await db.settings.clear()
    await db.odooSnapshots.clear()
    await db.missions.clear()
    await db.inventoryLines.clear()
    await db.syncQueue.clear()

    await db.zones.bulkAdd(data.zones)
    await db.sites.bulkAdd(data.sites)
    await db.stores.bulkAdd(data.stores)
    await db.entities.bulkAdd(data.entities)
    await db.products.bulkAdd(data.products)
    await db.profiles.bulkAdd(data.profiles)
    await db.missionCadences.bulkAdd(data.cadences)
    await db.settings.put(data.settings)
    await db.odooSnapshots.bulkAdd(data.snapshots)
    await db.missions.bulkAdd(data.missions)
    await db.inventoryLines.bulkAdd(data.lines)
    await db.syncQueue.bulkAdd(data.syncQueue)
  })
}
