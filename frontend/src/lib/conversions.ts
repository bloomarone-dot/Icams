import type {
  AppSettings,
  CountData,
  PackCount,
  ProductFamily,
} from '../types'

function packTotal(
  p: PackCount,
  rules: { cartonMul: number; paquetMul: number; balotMul: number },
  mode: 'cigarette' | 'vape' | 'gadget'
): number {
  if (mode === 'cigarette') {
    return p.cartons * rules.cartonMul + p.cartouches
  }
  if (mode === 'vape') {
    return p.cartons * rules.cartonMul + p.paquets * rules.paquetMul + p.pieces
  }
  return p.balots * rules.balotMul + p.unites
}

function imageBlockTotal(
  block: { bonEtat: PackCount; avarie: PackCount },
  rules: { cartonMul: number; paquetMul: number; balotMul: number },
  mode: 'cigarette' | 'vape'
): { total: number; avarie: number } {
  const bon = packTotal(block.bonEtat, rules, mode)
  const av = packTotal(block.avarie, rules, mode)
  return { total: bon + av, avarie: av }
}

export function computePhysicalQty(
  family: ProductFamily,
  data: CountData,
  settings: AppSettings
): { physicalQty: number; avarieQty: number } {
  const r = settings.conversionRules
  const cigaretteRules = { cartonMul: r.cigaretteCartonToCartouches, paquetMul: 0, balotMul: 0 }
  const vapeRules = {
    cartonMul: r.vapeCartonToPieces,
    paquetMul: r.vapePaquetToPieces,
    balotMul: 0,
  }
  const gadgetRules = { cartonMul: 0, paquetMul: 0, balotMul: r.gadgetBalotToUnits }

  if (family === 'CIGARETTE' && data.type === 'CIGARETTE') {
    const n = imageBlockTotal(data.nouvelleImage, cigaretteRules, 'cigarette')
    const a = imageBlockTotal(data.ancienneImage, cigaretteRules, 'cigarette')
    return { physicalQty: n.total + a.total, avarieQty: n.avarie + a.avarie }
  }

  if (family === 'VAPE' && data.type === 'VAPE') {
    const bon = packTotal(data.bonEtat, vapeRules, 'vape')
    const av = packTotal(data.avarie, vapeRules, 'vape')
    return { physicalQty: bon + av, avarieQty: av }
  }

  if (family === 'GADGET' && data.type === 'GADGET') {
    const total = packTotal(
      { cartons: 0, cartouches: 0, paquets: 0, pieces: 0, balots: data.balots, unites: data.unites },
      gadgetRules,
      'gadget'
    )
    return { physicalQty: total, avarieQty: 0 }
  }

  return { physicalQty: 0, avarieQty: 0 }
}

export function defaultCountData(family: ProductFamily): CountData {
  if (family === 'CIGARETTE') {
    return {
      type: 'CIGARETTE',
      nouvelleImage: {
        bonEtat: { cartons: 0, cartouches: 0, paquets: 0, pieces: 0, balots: 0, unites: 0 },
        avarie: { cartons: 0, cartouches: 0, paquets: 0, pieces: 0, balots: 0, unites: 0 },
      },
      ancienneImage: {
        bonEtat: { cartons: 0, cartouches: 0, paquets: 0, pieces: 0, balots: 0, unites: 0 },
        avarie: { cartons: 0, cartouches: 0, paquets: 0, pieces: 0, balots: 0, unites: 0 },
      },
    }
  }
  if (family === 'VAPE') {
    const empty = { cartons: 0, cartouches: 0, paquets: 0, pieces: 0, balots: 0, unites: 0 }
    return { type: 'VAPE', bonEtat: { ...empty }, avarie: { ...empty } }
  }
  return { type: 'GADGET', balots: 0, unites: 0 }
}

export function classifyEcart(ecart: number, avarieQty: number): string {
  if (ecart < 0) return 'Manquant'
  if (ecart > 0) return 'Excédent'
  if (avarieQty > 0) return 'Produit avarié'
  return 'Conforme'
}
