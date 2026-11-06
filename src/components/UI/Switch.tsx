// 開關：整列可點（文字＋開關），開關本身 84×48。給家長區用。

interface SwitchRowProps {
  readonly label: string
  readonly note?: string
  readonly checked: boolean
  readonly onChange: (next: boolean) => void
}

export default function SwitchRow({ label, note, checked, onChange }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-[20px]">{label}</div>
        {note && <div className="text-[16px] text-moss">{note}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="switch"
        onClick={() => onChange(!checked)}
      />
    </div>
  )
}
