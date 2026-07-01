import type { MissionCadence, Product, ProductFamily, Profile } from '../types'
import { uid } from '../lib/db'
import { DEFAULT_CADENCES } from '../lib/settings'

const ENTITIES = [
  { code: 'AFKOT' as const, name: 'AFKOT' },
  { code: 'BOSCAM' as const, name: 'BOSCAM' },
  { code: 'CTC' as const, name: 'CTC' },
]

const ZONES = ['ZONNE EST-SUD', 'ZONNE LITTORAL-OUEST', 'ZONNE GRAND NORD']

const SITES: { zone: string; name: string }[] = [
  { zone: 'ZONNE EST-SUD', name: 'GAROUA BOULAI' },
  { zone: 'ZONNE EST-SUD', name: 'BERTOUA' },
  { zone: 'ZONNE LITTORAL-OUEST', name: 'DOUALA' },
  { zone: 'ZONNE LITTORAL-OUEST', name: 'KUMBA' },
  { zone: 'ZONNE LITTORAL-OUEST', name: 'BAMENDA' },
  { zone: 'ZONNE LITTORAL-OUEST', name: 'BAFOUSSAM' },
  { zone: 'ZONNE GRAND NORD', name: 'MAROUA' },
  { zone: 'ZONNE GRAND NORD', name: 'GAROUA' },
  { zone: 'ZONNE GRAND NORD', name: 'NGAOUNDERE' },
]

export async function buildSeedData() {
  const zones = ZONES.map((name) => ({ id: uid('ZON-'), name, active: true }))
  const zoneByName = Object.fromEntries(zones.map((z) => [z.name, z.id]))

  const sites = SITES.map((s) => ({
    id: uid('SITE-'),
    zoneId: zoneByName[s.zone],
    name: s.name,
    active: true,
  }))

  const stores = sites.flatMap((site) =>
    ENTITIES.map((e) => ({
      id: uid('MAG-'),
      siteId: site.id,
      name: `${e.code} — ${sites.find((x) => x.id === site.id)!.name}`,
      odooLocationCode: `${e.code}/${sites.find((x) => x.id === site.id)!.name}`,
      active: true,
    }))
  )

  const entities = ENTITIES.map((e) => ({
    id: uid('ENT-'),
    code: e.code,
    name: e.name,
    active: true,
  }))

  const entityByCode = Object.fromEntries(entities.map((e) => [e.code, e.id]))
  const products: Product[] = []

  const afkotCig = [
    'Esse change 4mg', 'Esse change plus', 'Time change simple', 'Time change plus',
    'Time apple V', 'Time tropic V', 'Time gold V', 'Time red', 'Time strawberry V',
  ]
  afkotCig.forEach((d, i) =>
    products.push({
      id: uid('PRD-'),
      entityId: entityByCode.AFKOT,
      family: 'CIGARETTE' as ProductFamily,
      code: `AFK-C${String(i + 1).padStart(3, '0')}`,
      designation: d,
      brand: d.startsWith('Esse') ? 'Esse' : 'Time',
      packaging: 'Carton/Cartouche',
      unitPrice: 90,
      packPrice: 4500,
      active: true,
    })
  )

  const afkotGadget = [
    'Affiches Time', 'Affiches A3', 'Caisses', 'Casquettes', 'Presentoirs',
    'Parassols', 'Polos', 'Sacs plastiques',
  ]
  afkotGadget.forEach((d, i) =>
    products.push({
      id: uid('PRD-'),
      entityId: entityByCode.AFKOT,
      family: 'GADGET' as ProductFamily,
      code: `AFK-G${String(i + 1).padStart(3, '0')}`,
      designation: d,
      brand: 'Time',
      packaging: 'Balot/Unité',
      unitPrice: 500,
      packPrice: 50000,
      active: true,
    })
  )

  const bosVapes = [
    'vega str watermelon 0,8p', 'vega blueberry ice 0,8p', 'vega banana ice 0,8p',
    'vega str ice 0,8p', 'vega menthol ice 0,8p', 'vega str banana 1,5p',
    'vega grape-ICE 1,5p', 'vega str ice 1,5p',
  ]
  bosVapes.forEach((d, i) =>
    products.push({
      id: uid('PRD-'),
      entityId: entityByCode.BOSCAM,
      family: 'VAPE' as ProductFamily,
      code: `BOS-V${String(i + 1).padStart(3, '0')}`,
      designation: d,
      brand: 'Vega',
      packaging: 'Carton/Paquet/Pièce',
      unitPrice: 3500,
      packPrice: 350000,
      active: true,
    })
  )

  const bosCig = ['vega b10 v', 'vega b10 sv', 'vega b20sv', 'vega m10 v', 'vega ks apple mint 20 v', 'vega ks ice 20 v']
  bosCig.forEach((d, i) =>
    products.push({
      id: uid('PRD-'),
      entityId: entityByCode.BOSCAM,
      family: 'CIGARETTE' as ProductFamily,
      code: `BOS-C${String(i + 1).padStart(3, '0')}`,
      designation: d,
      brand: 'Vega',
      packaging: 'Carton/Cartouche',
      unitPrice: 120,
      packPrice: 6000,
      active: true,
    })
  )

  const ctcCig = ['GOLD SEAL B10 SV', 'GOLD SEAL B20 V', 'D&J M20 SV', 'ORIS PULSE YELLOW FIZZ SS 20']
  ctcCig.forEach((d, i) =>
    products.push({
      id: uid('PRD-'),
      entityId: entityByCode.CTC,
      family: 'CIGARETTE' as ProductFamily,
      code: `CTC-C${String(i + 1).padStart(3, '0')}`,
      designation: d,
      brand: d.includes('GOLD') ? 'Gold Seal' : d.includes('ORIS') ? 'Oris' : 'D&J',
      packaging: 'Carton/Cartouche',
      unitPrice: 100,
      packPrice: 5000,
      active: true,
    })
  )

  const profiles: Profile[] = [
    {
      id: uid('USR-'),
      name: 'Contrôleur Terrain',
      role: 'CONTROLEUR',
      entityIds: entities.map((e) => e.id),
      zoneIds: zones.map((z) => z.id),
      passwordHash: '',
      active: true,
    },
    {
      id: uid('USR-'),
      name: 'Direction CDG ATG',
      role: 'DIRECTION',
      entityIds: entities.map((e) => e.id),
      zoneIds: zones.map((z) => z.id),
      passwordHash: '',
      active: true,
    },
    {
      id: uid('USR-'),
      name: 'Administrateur ICAMS',
      role: 'ADMIN',
      entityIds: entities.map((e) => e.id),
      zoneIds: zones.map((z) => z.id),
      passwordHash: '',
      active: true,
    },
  ]

  const cadences: MissionCadence[] = DEFAULT_CADENCES.map((c) => ({
    id: uid('CAD-'),
    ...c,
    active: true,
  }))

  return { zones, sites, stores, entities, products, profiles, cadences }
}

export function familyLabel(f: ProductFamily): string {
  if (f === 'CIGARETTE') return 'Cigarettes'
  if (f === 'GADGET') return 'Gadgets'
  return 'Vapes'
}

export const FAMILIES_BY_ENTITY = {
  AFKOT: ['CIGARETTE', 'GADGET'] as ProductFamily[],
  BOSCAM: ['CIGARETTE', 'GADGET', 'VAPE'] as ProductFamily[],
  CTC: ['CIGARETTE', 'GADGET'] as ProductFamily[],
}
