import { useState, useEffect } from 'react'
import { Save, Image } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function SettingsPage() {
  const { settings, updateSettings } = useApp()
  const [local, setLocal] = useState(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => setLocal(settings), [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateSettings(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const setRule = (key: keyof typeof local.conversionRules, val: number) => {
    setLocal({ ...local, conversionRules: { ...local.conversionRules, [key]: val } })
  }

  const setOdoo = (key: keyof typeof local.odooImportMapping, val: string) => {
    setLocal({ ...local, odooImportMapping: { ...local.odooImportMapping, [key]: val } })
  }

  const setTheme = (key: keyof typeof local.theme, val: string) => {
    setLocal({ ...local, theme: { ...local.theme, [key]: val } })
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLocal({ ...local, theme: { ...local.theme, logoDataUrl: reader.result as string } })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black">Paramètres ICAMS</h1>
        <p className="text-sm text-slate-400">Apparence, règles métier, Odoo et comportement — entièrement configurables.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <Section title="Apparence & branding">
          <Field label="Nom organisation" value={local.companyName} onChange={(v) => setLocal({ ...local, companyName: v })} />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Couleur principale</label>
              <input type="color" value={local.theme.primaryColor} onChange={(e) => setTheme('primaryColor', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Couleur accent</label>
              <input type="color" value={local.theme.accentColor} onChange={(e) => setTheme('accentColor', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Fond</label>
              <input type="color" value={local.theme.backgroundColor} onChange={(e) => setTheme('backgroundColor', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400 flex items-center gap-2"><Image className="w-3.5 h-3.5" /> Logo de l&apos;application</label>
            {local.theme.logoDataUrl && (
              <img src={local.theme.logoDataUrl} alt="Aperçu logo" className="h-16 object-contain bg-slate-900 rounded-xl p-2" />
            )}
            <input type="file" accept="image/*" onChange={handleLogo} className="text-sm" />
            {local.theme.logoDataUrl && (
              <button type="button" onClick={() => setLocal({ ...local, theme: { ...local.theme, logoDataUrl: undefined } })} className="text-xs text-rose-400">Supprimer le logo</button>
            )}
          </div>
        </Section>

        <Section title="Général">
          <Field label="Devise" value={local.currency} onChange={(v) => setLocal({ ...local, currency: v })} />
          <Field label="Préfixe export Odoo" value={local.odooExportPrefix} onChange={(v) => setLocal({ ...local, odooExportPrefix: v })} />
        </Section>

        <Section title="Règles de conversion (emballages)">
          <Field label="1 carton cigarettes = cartouches" type="number" value={String(local.conversionRules.cigaretteCartonToCartouches)} onChange={(v) => setRule('cigaretteCartonToCartouches', +v)} />
          <Field label="1 balot gadgets = unités" type="number" value={String(local.conversionRules.gadgetBalotToUnits)} onChange={(v) => setRule('gadgetBalotToUnits', +v)} />
          <Field label="1 carton vapes = pièces" type="number" value={String(local.conversionRules.vapeCartonToPieces)} onChange={(v) => setRule('vapeCartonToPieces', +v)} />
          <Field label="1 paquet vapes = pièces" type="number" value={String(local.conversionRules.vapePaquetToPieces)} onChange={(v) => setRule('vapePaquetToPieces', +v)} />
        </Section>

        <Section title="Mapping import Odoo">
          <Field label="Code produit" value={local.odooImportMapping.productCode} onChange={(v) => setOdoo('productCode', v)} />
          <Field label="Nom produit" value={local.odooImportMapping.productName} onChange={(v) => setOdoo('productName', v)} />
          <Field label="Emplacement" value={local.odooImportMapping.location} onChange={(v) => setOdoo('location', v)} />
          <Field label="Quantité" value={local.odooImportMapping.quantity} onChange={(v) => setOdoo('quantity', v)} />
        </Section>

        <Section title="Observations terrain">
          <textarea
            rows={6}
            value={local.observationTemplates.join('\n')}
            onChange={(e) => setLocal({ ...local, observationTemplates: e.target.value.split('\n').filter(Boolean) })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"
          />
        </Section>

        <Section title="Comportement">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={local.allowOfflineMode} onChange={(e) => setLocal({ ...local, allowOfflineMode: e.target.checked })} />
            Mode hors ligne terrain
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={local.requireOdooSnapshotBeforeCount} onChange={(e) => setLocal({ ...local, requireOdooSnapshotBeforeCount: e.target.checked })} />
            Exiger import Odoo avant mission
          </label>
        </Section>

        <button type="submit" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: 'var(--icams-primary)' }}>
          <Save className="w-4 h-4" /> Enregistrer
        </button>
        {saved && <p className="text-emerald-400 text-sm text-center">Paramètres enregistrés.</p>}
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="font-bold" style={{ color: 'var(--icams-accent)' }}>{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm" />
    </div>
  )
}
