import type { AppSettings } from '../types'

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  companyName: 'ATG — Inventory Control & Audit',
  currency: 'FCFA',
  theme: {
    primaryColor: '#4f46e5',
    accentColor: '#818cf8',
    backgroundColor: '#020617',
    logoDataUrl: undefined,
  },
  conversionRules: {
    cigaretteCartonToCartouches: 50,
    gadgetBalotToUnits: 100,
    vapeCartonToPieces: 100,
    vapePaquetToPieces: 10,
  },
  odooImportMapping: {
    productCode: 'default_code',
    productName: 'name',
    location: 'location',
    quantity: 'quantity',
    uom: 'uom',
  },
  odooExportPrefix: 'ICAMS_AJUSTEMENT',
  observationTemplates: [
    'RAS',
    'manquant constaté',
    'excédent constaté',
    'à régulariser',
    'confusion de parfum',
    'confusion nouvelle/ancienne image',
    'écart non livré',
  ],
  missionStatuses: ['BROUILLON', 'EN_COURS', 'SOUMIS', 'VALIDE', 'EXPORTE'],
  syncRetryMinutes: 5,
  allowOfflineMode: true,
  requireOdooSnapshotBeforeCount: false,
}

export const DEFAULT_CADENCES = [
  { name: 'Journalier', intervalDays: 1, description: 'Contrôle quotidien', sortOrder: 1 },
  { name: 'Mensuel', intervalDays: 30, description: 'Inventaire mensuel', sortOrder: 2 },
  { name: 'Bimensuel', intervalDays: 60, description: 'Tous les deux mois', sortOrder: 3 },
  { name: 'Trimestriel', intervalDays: 90, description: 'Inventaire trimestriel', sortOrder: 4 },
  { name: 'Annuel', intervalDays: 365, description: 'Inventaire annuel', sortOrder: 5 },
]

export function mergeSettings(partial: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    theme: { ...DEFAULT_SETTINGS.theme, ...partial.theme },
    conversionRules: { ...DEFAULT_SETTINGS.conversionRules, ...partial.conversionRules },
    odooImportMapping: { ...DEFAULT_SETTINGS.odooImportMapping, ...partial.odooImportMapping },
    observationTemplates: partial.observationTemplates ?? DEFAULT_SETTINGS.observationTemplates,
    missionStatuses: partial.missionStatuses ?? DEFAULT_SETTINGS.missionStatuses,
  }
}
