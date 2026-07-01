import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { AppSettings, OdooSnapshot, OdooSnapshotLine, Product } from '../types'
import { uid } from './db'

type Row = Record<string, unknown>

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim()
}

function pick(row: Row, keys: string[]): string {
  for (const k of Object.keys(row)) {
    const nk = norm(k)
    for (const key of keys) {
      if (nk === norm(key) || nk.includes(norm(key))) {
        const v = row[k]
        return v != null ? String(v).trim() : ''
      }
    }
  }
  return ''
}

function pickNum(row: Row, keys: string[]): number {
  const s = pick(row, keys)
  const n = parseFloat(s.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function parseOdooRows(
  rows: Row[],
  mapping: AppSettings['odooImportMapping'],
  products: Product[]
): OdooSnapshotLine[] {
  const byCode = new Map(products.map((p) => [norm(p.odooProductCode || p.code), p]))
  const byName = new Map(products.map((p) => [norm(p.designation), p]))

  const lines: OdooSnapshotLine[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const code = pick(row, [mapping.productCode, 'default_code', 'code', 'reference', 'ref'])
    const name = pick(row, [mapping.productName, 'name', 'designation', 'produit', 'product'])
    const qty = pickNum(row, [mapping.quantity, 'quantity', 'qty', 'stock', 'quantite', 'stock systeme'])

    let product = code ? byCode.get(norm(code)) : undefined
    if (!product && name) product = byName.get(norm(name))
    if (!product) continue

    if (seen.has(product.id)) {
      const existing = lines.find((l) => l.productId === product!.id)
      if (existing) existing.systemQty += qty
      continue
    }
    seen.add(product.id)
    lines.push({
      productId: product.id,
      productCode: product.odooProductCode || product.code,
      designation: product.designation,
      systemQty: qty,
      uom: pick(row, [mapping.uom, 'uom', 'udm']) || undefined,
    })
  }
  return lines
}

export async function importOdooFile(
  file: File,
  storeId: string,
  settings: AppSettings,
  products: Product[]
): Promise<OdooSnapshot> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  let rows: Row[] = []

  if (ext === 'csv') {
    const text = await file.text()
    const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true })
    rows = parsed.data
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json<Row>(sheet)
  } else {
    throw new Error('Format non supporté. Utilisez CSV ou XLSX.')
  }

  const lines = parseOdooRows(rows, settings.odooImportMapping, products)
  if (lines.length === 0) {
    throw new Error('Aucune ligne reconnue. Vérifiez le mapping des colonnes dans Paramètres.')
  }

  return {
    id: uid('SNAP-'),
    storeId,
    fileName: file.name,
    importedAt: new Date().toISOString(),
    lines,
  }
}

export function exportOdooAdjustmentCsv(
  lines: { productCode: string; designation: string; location: string; theoretical: number; counted: number; ecart: number }[],
  _prefix: string
): string {
  const header = 'product_code,designation,location,theoretical_qty,counted_qty,difference'
  const body = lines.map(
    (l) =>
      `"${l.productCode}","${l.designation}","${l.location}",${l.theoretical},${l.counted},${l.ecart}`
  )
  return [header, ...body].join('\n')
}

export function downloadText(content: string, filename: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
