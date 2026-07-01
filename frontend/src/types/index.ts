export type EntityCode = 'AFKOT' | 'BOSCAM' | 'CTC'
export type ProductFamily = 'CIGARETTE' | 'GADGET' | 'VAPE'
export type UserRole = 'ADMIN' | 'DIRECTION' | 'CONTROLEUR'
export type MissionStatus = 'BROUILLON' | 'EN_COURS' | 'SOUMIS' | 'VALIDE' | 'EXPORTE'
export type SyncStatus = 'LOCAL' | 'PENDING' | 'SYNCED'

export interface Zone {
  id: string
  name: string
  active: boolean
}

export interface Site {
  id: string
  zoneId: string
  name: string
  active: boolean
}

export interface Store {
  id: string
  siteId: string
  name: string
  odooLocationCode?: string
  active: boolean
}

export interface Entity {
  id: string
  code: EntityCode
  name: string
  active: boolean
}

export interface Product {
  id: string
  entityId: string
  family: ProductFamily
  code: string
  designation: string
  brand?: string
  packaging?: string
  odooProductCode?: string
  /** Prix unitaire (cartouche, pièce, unité libre) en FCFA */
  unitPrice?: number
  /** Prix par carton / balot / conditionnement principal */
  packPrice?: number
  active: boolean
}

export interface Profile {
  id: string
  name: string
  email?: string
  role: UserRole
  entityIds: string[]
  zoneIds: string[]
  passwordHash: string
  active: boolean
}

/** Fréquence définie par l'administrateur (journalier, mensuel, etc.) */
export interface MissionCadence {
  id: string
  name: string
  intervalDays: number
  description?: string
  active: boolean
  sortOrder: number
}

export interface ThemeSettings {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  logoDataUrl?: string
}

export interface ConversionRules {
  cigaretteCartonToCartouches: number
  gadgetBalotToUnits: number
  vapeCartonToPieces: number
  vapePaquetToPieces: number
}

export interface OdooColumnMapping {
  productCode: string
  productName: string
  location: string
  quantity: string
  uom: string
}

export interface AppSettings {
  id: 'global'
  companyName: string
  currency: string
  theme: ThemeSettings
  conversionRules: ConversionRules
  odooImportMapping: OdooColumnMapping
  odooExportPrefix: string
  observationTemplates: string[]
  missionStatuses: MissionStatus[]
  syncRetryMinutes: number
  allowOfflineMode: boolean
  requireOdooSnapshotBeforeCount: boolean
  /** Migration interne — ne pas modifier manuellement */
  authSetupVersion?: number
}

export interface PackCount {
  cartons: number
  cartouches: number
  paquets: number
  pieces: number
  balots: number
  unites: number
}

export interface ImageCountBlock {
  bonEtat: PackCount
  avarie: PackCount
}

export interface CigaretteCount {
  type: 'CIGARETTE'
  nouvelleImage: ImageCountBlock
  ancienneImage: ImageCountBlock
}

export interface GadgetCount {
  type: 'GADGET'
  balots: number
  unites: number
}

export interface VapeCount {
  type: 'VAPE'
  bonEtat: PackCount
  avarie: PackCount
}

export type CountData = CigaretteCount | GadgetCount | VapeCount

export interface OdooSnapshotLine {
  productId: string
  productCode: string
  designation: string
  systemQty: number
  uom?: string
}

export interface OdooSnapshot {
  id: string
  storeId: string
  fileName: string
  importedAt: string
  importedBy?: string
  lines: OdooSnapshotLine[]
}

export interface InventoryLine {
  id: string
  missionId: string
  productId: string
  countData: CountData
  physicalQty: number
  systemQty: number
  ecart: number
  avarieQty: number
  ecartValue: number
  observation: string
  updatedAt: string
}

export interface Mission {
  id: string
  name: string
  storeId: string
  entityId: string
  family: ProductFamily
  cadenceId: string
  isPermanent: boolean
  assignedControllerIds: string[]
  controllerId: string
  createdByProfileId?: string
  snapshotId?: string
  status: MissionStatus
  syncStatus: SyncStatus
  startedAt: string
  submittedAt?: string
  nextDueDate?: string
  notes?: string
}

export interface SyncQueueItem {
  id: string
  missionId: string
  payload: string
  createdAt: string
  attempts: number
  status: 'PENDING' | 'DONE' | 'FAILED'
}

export const EMPTY_PACK: PackCount = {
  cartons: 0,
  cartouches: 0,
  paquets: 0,
  pieces: 0,
  balots: 0,
  unites: 0,
}

export function emptyImageBlock(): ImageCountBlock {
  return { bonEtat: { ...EMPTY_PACK }, avarie: { ...EMPTY_PACK } }
}

export function canAccessDesk(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'DIRECTION'
}
