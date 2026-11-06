import { useId, type ReactNode } from 'react'

// 家長區的一個區塊：紙白底、斜墊一張薄荷紙，標題用 h2。

export default function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const id = useId()
  return (
    <section className="sheet sheet-paper gap-3 p-5 sm:p-6" aria-labelledby={id}>
      <h2 id={id} className="m-0 text-[26px] font-normal">{title}</h2>
      {note && <p className="m-0 text-[17px] text-moss">{note}</p>}
      {children}
    </section>
  )
}
