import { useEffect, useState } from 'react'
import BigButton from '../../../components/UI/BigButton'
import SwitchRow from '../../../components/UI/Switch'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { testAIConnection } from '../../../services/ai'
import Section from './Section'

type Provider = 'openai' | 'gemini'

// 原本設定頁的 AI 金鑰、連線測試，加上原本放在數學與恐龍商店畫面上的「AI 出題」切換，
// 以及第二階段才會用到的 AI 陪玩下棋設定。孩子那邊看不到這些。

function inferProviderFromKey(key: string): Provider | null {
  if (key.startsWith('AIza')) return 'gemini'
  if (key.startsWith('sk-')) return 'openai'
  return null
}

export default function AISection() {
  const aiConfig = useGameStore((s) => s.aiConfig)
  const setAIConfig = useGameStore((s) => s.setAIConfig)
  const aiModes = useGameStore((s) => s.aiModes)
  const setAIMode = useGameStore((s) => s.setAIMode)
  const companion = useSettingsStore((s) => s.companion)
  const setCompanion = useSettingsStore((s) => s.setCompanion)

  const [provider, setProvider] = useState<Provider>(aiConfig?.provider ?? 'openai')
  const [apiKey, setApiKey] = useState(aiConfig?.apiKey ?? '')
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setProvider(aiConfig?.provider ?? 'openai')
    setApiKey(aiConfig?.apiKey ?? '')
  }, [aiConfig])

  const save = () => {
    const key = apiKey.trim()
    if (!key) {
      setAIConfig(null)
      setSaved(true)
      return
    }
    const finalProvider = inferProviderFromKey(key) ?? provider
    setProvider(finalProvider)
    setAIConfig({ provider: finalProvider, apiKey: key })
    setSaved(true)
  }

  const test = async () => {
    const key = apiKey.trim()
    setTesting(true)
    setTestResult(null)
    const result = await testAIConnection({ provider: inferProviderFromKey(key) ?? provider, apiKey: key })
    setTestResult(result)
    setTesting(false)
  }

  return (
    <Section title="AI 設定">
      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-[22px] font-normal">AI 服務與金鑰</h3>
        <p className="m-0 text-[17px] text-moss">
          金鑰只存在這台裝置的瀏覽器裡。貼上 AIza 開頭的金鑰會自動選 Google Gemini、sk- 開頭會選 OpenAI。
          AI 連不上時，孩子那邊會自動改用內建題庫，不會看到錯誤訊息。
        </p>
        <label className="flex flex-col gap-1">
          <span className="text-[18px] text-moss">AI 服務</span>
          <select
            value={provider}
            onChange={(e) => { setProvider(e.target.value as Provider); setSaved(false) }}
            className="min-h-14 rounded-2xl border-2 border-leaf-d bg-white px-4 text-[20px]"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[18px] text-moss">金鑰</span>
          <input
            type="password"
            value={apiKey}
            autoComplete="off"
            onChange={(e) => { setApiKey(e.target.value); setSaved(false) }}
            placeholder="sk-… 或 AIza…"
            className="min-h-14 rounded-2xl border-2 border-leaf-d bg-white px-4 text-[20px]"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <BigButton variant="secondary" onClick={save}>儲存金鑰</BigButton>
          <BigButton variant="secondary" onClick={test} disabled={testing || !apiKey.trim()}>
            {testing ? '測試中…' : '測試連線'}
          </BigButton>
          {saved && <span className="text-pine-d">已儲存</span>}
        </div>
        {testResult && (
          <p role="status" className={`m-0 rounded-2xl px-4 py-2 ${testResult.ok ? 'bg-pine-l text-pine-d' : 'bg-berry-l text-berry-d'}`}>
            {testResult.message.replace(/^[✅❌]\s*/u, '')}
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
