import { useEffect, useId, useRef } from 'react'
import { HelpIcon } from '../art/icons'

// 「怎麼玩」說明卡：一句一行，按「知道了」或 Esc 關掉。

export default function HelpSheet({ title, lines, onClose }: { title: string; lines: readonly string[]; onClose: () => void }) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-3">
          <HelpIcon className="h-10 w-10 flex-none" />
          <h2 id={titleId} className="m-0 text-[28px] font-normal">{title}怎麼玩</h2>
        </div>
        <ol className="m-0 flex flex-col gap-2 pl-7 text-[21px]">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <div className="mt-6 flex justify-center">
          <button ref={closeRef} type="button" className="big-btn big-btn--primary" onClick={onClose}>
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}
