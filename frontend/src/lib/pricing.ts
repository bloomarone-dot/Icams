import type { AppSettings, Product, ProductFamily } from '../types'

/** Calcule la valorisation financière d'un écart en respectant prix carton/balot + prix unitaire */
export function computeEcartValue(
  ecart: number,
  product: Product,
  family: ProductFamily,
  settings: AppSettings
): number {
  const abs = Math.abs(ecart)
  if (abs === 0) return 0

  const unit = product.unitPrice ?? 0
  const pack = product.packPrice ?? 0
  const rules = settings.conversionRules

  let packSize = 1
  if (family === 'CIGARETTE') packSize = rules.cigaretteCartonToCartouches
  else if (family === 'GADGET') packSize = rules.gadgetBalotToUnits
  else if (family === 'VAPE') packSize = rules.vapeCartonToPieces

  if (pack > 0 && packSize > 1) {
    const fullPacks = Math.floor(abs / packSize)
    const remainder = abs % packSize
    const unitPrice = unit > 0 ? unit : pack / packSize
    return fullPacks * pack + remainder * unitPrice
  }

  const effectiveUnit = unit > 0 ? unit : pack > 0 && packSize > 0 ? pack / packSize : 4500
  return abs * effectiveUnit
}

export function formatMoney(amount: number, currency: string): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} ${currency}`
}
