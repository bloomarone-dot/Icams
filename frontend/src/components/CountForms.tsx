import type { CigaretteCount, GadgetCount, VapeCount } from '../types'
import { PackFields } from './NumField'

interface CigaretteFormProps {
  data: CigaretteCount
  onChange: (d: CigaretteCount) => void
}

export function CigaretteCountForm({ data, onChange }: CigaretteFormProps) {
  const section = (
    title: string,
    block: CigaretteCount['nouvelleImage'],
    key: 'nouvelleImage' | 'ancienneImage'
  ) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
      <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{title}</h4>
      <div>
        <p className="text-[10px] text-emerald-400 font-semibold mb-2">Bon état</p>
        <PackFields
          pack={block.bonEtat}
          onChange={(bonEtat) => onChange({ ...data, [key]: { ...block, bonEtat } })}
          fields={['cartons', 'cartouches']}
        />
      </div>
      <div>
        <p className="text-[10px] text-rose-400 font-semibold mb-2">Avarié</p>
        <PackFields
          pack={block.avarie}
          onChange={(avarie) => onChange({ ...data, [key]: { ...block, avarie } })}
          fields={['cartons', 'cartouches']}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {section('Nouvelle image', data.nouvelleImage, 'nouvelleImage')}
      {section('Ancienne image', data.ancienneImage, 'ancienneImage')}
    </div>
  )
}

interface VapeFormProps {
  data: VapeCount
  onChange: (d: VapeCount) => void
}

export function VapeCountForm({ data, onChange }: VapeFormProps) {
  return (
    <div className="space-y-4">
      {(['bonEtat', 'avarie'] as const).map((k) => (
        <div key={k} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className={`text-xs font-bold uppercase ${k === 'bonEtat' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {k === 'bonEtat' ? 'Bon état' : 'Avarié'}
          </h4>
          <PackFields
            pack={data[k]}
            onChange={(p) => onChange({ ...data, [k]: p })}
            fields={['cartons', 'paquets', 'pieces']}
          />
        </div>
      ))}
    </div>
  )
}

interface GadgetFormProps {
  data: GadgetCount
  onChange: (d: GadgetCount) => void
}

export function GadgetCountForm({ data, onChange }: GadgetFormProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <PackFields
        pack={{ cartons: 0, cartouches: 0, paquets: 0, pieces: 0, balots: data.balots, unites: data.unites }}
        onChange={(p) => onChange({ type: 'GADGET', balots: p.balots, unites: p.unites })}
        fields={['balots', 'unites']}
        labels={{ balots: 'Carton / Balot', unites: 'Unités libres' }}
      />
    </div>
  )
}
