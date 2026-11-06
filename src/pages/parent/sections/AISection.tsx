import { useEffect, useId, useState } from 'react'
import BigButton from '../../../components/UI/BigButton'
import SwitchRow from '../../../components/UI/Switch'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { checkAIStatus, isValidPasscode, type AIStatusResult } from '../../../services/ai'
import Section from './Section'

// AI 出題由網站伺服器負責（伺服器再呼叫 Claude）。家長在這裡輸入一次「家用通行碼」，
// 只存在這台裝置；「檢查」問伺服器通行碼對不對、今天還能出幾題。
// 下面是原本放在數學與恐龍商店畫面上的「AI 出題」切換，以及第二階段才會用到的 AI 陪玩下棋設定。孩子那邊看不到這些。

const FORMAT_RULE = '通行碼只能用英文字母、數字和 -，長度 8 到 64 字'

function statusText(result: AIStatusResult): string {
  switch (result.kind) {
    case 'ok':
      return `通行碼正確，今天還能出 ${result.remainingToday} 題`
    case 'disabled':
      return 'AI 服務目前沒有開'
    case 'wrong_passcode':
      return '通行碼不對'
    case 'locked':
      return '錯太多次，請 15 分鐘後再試'
    case 'try_later':
      return '請稍等一分鐘再試'
    case 'daily_limit':
      return '今天的 AI 題目用完了，明天再試'
    case 'no_service':
      return '這個網址沒有 AI 服務'
  }
}

export default function AISection() {
  const aiConfig = useGameStore((s) => s.aiConfig)
  const setAIConfig = useGameStore((s) => s.setAIConfig)
  const aiModes = useGameStore((s) => s.aiModes)
  const setAIMode = useGameStore((s) => s.setAIMode)
  const companion = useSettingsStore((s) => s.companion)
  const setCompanion = useSettingsStore((s) => s.setCompanion)
  const inputId = useId()

  const [passcode, setPasscode] = useState(aiConfig?.passcode ?? '')
  const [show, setShow] = useState(false)
  const [formatError, setFormatError] = useState(false)
  const [saved, setSaved] = useState<'saved' | 'cleared' | null>(null)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<AIStatusResult | null>(null)

  useEffect(() => {
    setPasscode(aiConfig?.passcode ?? '')
  }, [aiConfig])

  const edit = (value: string) => {
    setPasscode(value)
    setSaved(null)
    setFormatError(false)
    setResult(null)
  }

  const save = () => {
    setResult(null)
    if (passcode === '') {
      setAIConfig(null)
      setSaved('cleared')
      return
    }
    if (!isValidPasscode(passcode)) {
      setFormatError(true)
      setSaved(null)
      return
    }
    setAIConfig({ passcode })
    setSaved('saved')
  }

  const check = async () => {
    setResult(null)
    if (!isValidPasscode(passcode)) {
      setFormatError(true)
      return
    }
    setChecking(true)
    const next = await checkAIStatus(passcode)
    setResult(next)
    setChecking(false)
  }

  return (
    <Section title="AI 設定">
      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-[22px] font-normal">連上 AI 服務</h3>
        <p className="m-0 text-[17px] text-moss">
          AI 出題由這個網站的伺服器負責。輸入家裡設定的通行碼後，數學挑戰與恐龍商店才會向伺服器要題目；通行碼只存在這台裝置。
          AI 連不上時，孩子那邊會自動改用內建題庫，不會看到錯誤訊息。
        </p>
        <label htmlFor={inputId} className="text-[18px] text-moss">家用通行碼</label>
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type={show ? 'text' : 'password'}
            value={passcode}
            onChange={(e) => edit(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={64}
            pattern="[A-Za-z0-9\-]{8,64}"
            aria-describedby={formatError ? `${inputId}-rule` : undefined}
            className="min-h-14 min-w-0 flex-1 rounded-2xl border-2 border-leaf-d bg-white px-4 text-[20px]"
          />
          <button
            type="button"
            className="pill"
            aria-pressed={show}
            aria-label={show ? '隱藏通行碼' : '顯示通行碼'}
            onClick={() => setShow((v) => !v)}
          >
            {show ? '隱藏' : '顯示'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BigButton variant="secondary" onClick={save}>儲存</BigButton>
          <BigButton variant="secondary" onClick={() => void check()} disabled={checking}>
            {checking ? '檢查中…' : '檢查'}
          </BigButton>
          {saved === 'saved' && <span className="text-pine-d">已儲存</span>}
          {saved === 'cleared' && <span className="text-moss">已清除通行碼</span>}
        </div>
        {formatError && (
          <p id={`${inputId}-rule`} role="alert" className="m-0 rounded-2xl bg-berry-l px-4 py-2 text-berry-d">
            {FORMAT_RULE}
          </p>
        )}
        {result && (
          <p
            role="status"
            className={`m-0 rounded-2xl px-4 py-2 ${result.kind === 'ok' ? 'bg-pine-l text-pine-d' : 'bg-berry-l text-berry-d'}`}
          >
            {statusText(result)}
          </p>
        )}
      </section>

      <section className="flex flex-col">
        <h3 className="m-0 text-[22px] font-normal">AI 出題</h3>
        <SwitchRow
          label="數學挑戰用 AI 出題"
          note="關掉就只用內建題庫"
          checked={aiModes.math === 'ai'}
          onChange={(on) => setAIMode('math', on ? 'ai' : 'local')}
        />
        <SwitchRow
          label="恐龍商店用 AI 出題"
          note="需要點商品或硬幣的題目一律用內建題庫"
          checked={aiModes['dino-shop'] === 'ai'}
          onChange={(on) => setAIMode('dino-shop', on ? 'ai' : 'local')}
        />
      </section>

      <section className="flex flex-col">
        <h3 className="m-0 text-[22px] font-normal">AI 陪玩下棋</h3>
        <p className="m-0 text-[17px] text-moss">陪玩功能在下一階段才會做好，這裡先記下你的選擇。</p>
        <SwitchRow
          label="讓 AI 陪孩子下棋"
          checked={companion.enabled}
          onChange={(on) => setCompanion({ enabled: on })}
        />
        <SwitchRow
          label="陪玩時講解每一步"
          checked={companion.explain}
          onChange={(on) => setCompanion({ explain: on })}
        />
      </section>
    </Section>
  )
}
