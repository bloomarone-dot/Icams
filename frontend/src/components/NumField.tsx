import type { PackCount } from '../types'

interface NumFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
}

export function NumField({ label, value, onChange }: NumFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-slate-500 font-medium uppercase">{label}</label>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value || ''}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-lg font-bold text-white focus:outline-none focus:border-indigo-500"
      />
    </div>
  )
}

interface PackFieldsProps {
  pack: PackCount
  onChange: (p: PackCount) => void
  fields: ('cartons' | 'cartouches' | 'paquets' | 'pieces' | 'balots' | 'unites')[]
  labels?: Partial<Record<keyof PackCount, string>>
}

const DEFAULT_LABELS: Record<string, string> = {
  cartons: 'Cartons',
  cartouches: 'Cartouches',
  paquets: 'Paquets',
  pieces: 'Pièces',
  balots: 'Balots',
  unites: 'Unités',
}

export function PackFields({ pack, onChange, fields, labels }: PackFieldsProps) {
  return (
    <div className={`grid gap-3 ${fields.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {fields.map((f) => (
        <NumField
          key={f}
          label={labels?.[f] ?? DEFAULT_LABELS[f]}
          value={pack[f]}
          onChange={(v) => onChange({ ...pack, [f]: v })}
        />
      ))}
    </div>
  )
}
