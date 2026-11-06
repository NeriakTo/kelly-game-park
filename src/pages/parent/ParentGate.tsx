import { useEffect, useRef, useState, type FormEvent } from 'react'
import BigButton from '../../components/UI/BigButton'
import { LockIcon } from '../../components/art/icons'
import { HOLD_TO_OPEN_MS, makeGateQuestion } from '../../stores/parentGate'

// 家長驗證：長按 3 秒，或算一題兩位數乘法。通過後交給 onPass（由家長區記下開門時間）。
// iPad 長按會跳出文字選取與選單，所以按鈕要擋掉 callout、選取與預設手勢，不然 3 秒撐不到。

export default function ParentGate({ onPass }: { onPass: () => void }) {
  const [question, setQuestion] = useState(() => makeGateQuestion())
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  const [holding, setHolding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHold = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => clearHold, [])

  const startHold = () => {
    clearHold()
    setHolding(true)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setHolding(false)
      onPass()
    }, HOLD_TO_OPEN_MS)
  }

  const cancelHold = () => {
    clearHold()
    setHolding(false)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (Number(value.trim()) === question.answer && value.trim() !== '') {
      onPass()
      return
    }
    setWrong(true)
    setValue('')
    setQuestion(makeGateQuestion())
  }

  return (
    <section className="sheet sheet-paper mx-auto mt-10 w-full max-w-xl gap-6 p-6 sm:p-8" aria-labelledby="gate-title">
      <div className="flex items-center gap-3">
        <LockIcon className="h-10 w-10 flex-none" />
        <h2 id="gate-title" className="m-0 text-[28px] font-normal">請爸爸或媽媽來開門</h2>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="m-0 text-moss">方法一：按住下面的按鈕 3 秒</p>
        <button
          type="button"
          aria-label="按住 3 秒進入家長區"
          className="relative h-28 w-28 select-none overflow-hidden rounded-full bg-leaf text-ink shadow-[0_6px_0_var(--color-leaf-d)]"
          style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 bg-pine-s"
            style={{
              height: holding ? '100%' : '0%',
              transition: holding ? `height ${HOLD_TO_OPEN_MS}ms linear` : 'none',
            }}
          />
          <span className="relative text-[20px]">{holding ? '按住…' : '按住 3 秒'}</span>
        </button>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <p className="m-0 text-moss">方法二：算一題</p>
        <p data-testid="gate-question" className="m-0 text-[30px]">
          {question.a} × {question.b} = ？
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="gate-answer" className="text-[20px]">答案</label>
          <input
            id="gate-answer"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/[^\d]/g, ''))
              setWrong(false)
            }}
            className="min-h-14 w-40 rounded-2xl border-2 border-leaf-d bg-white px-4 text-[24px]"
          />
          <BigButton type="submit" variant="primary">確認</BigButton>
        </div>
        {wrong && (
          <p role="alert" className="m-0 text-berry-d">答案不對，請再算一次</p>
        )}
      </form>
    </section>
  )
}
