import { useState } from 'react'
import { Save } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'

const AVATARS = ['🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🦄', '🐧']

export default function SettingsPage() {
  const profile = useGameStore((s) => s.profile)
  const setProfile = useGameStore((s) => s.setProfile)
  const aiConfig = useGameStore((s) => s.aiConfig)
  const setAIConfig = useGameStore((s) => s.setAIConfig)
  const scores = useGameStore((s) => s.scores)
  const [nickname, setNickname] = useState(profile.nickname)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [aiProvider, setAiProvider] = useState<'openai' | 'gemini'>(aiConfig?.provider ?? 'openai')
  const [apiKey, setApiKey] = useState(aiConfig?.apiKey ?? '')

  const saveProfile = () => setProfile({ nickname, avatar })
  const saveAI = () => {
    if (apiKey.trim()) setAIConfig({ provider: aiProvider, apiKey: apiKey.trim() })
    else setAIConfig(null)
  }

  const totalGames = scores.length
  const bestScores = scores.reduce((acc, s) => {
    const key = `${s.gameType}-${s.difficulty}`
    if (!acc[key] || s.score > acc[key]) acc[key] = s.score
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center">⚙️ 設定</h2>

      {/* Profile */}
      <section className="bg-white/60 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-lg">👤 個人資料</h3>
        <div>
          <label className="text-sm text-warm-text-light">暱稱</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>
        <div>
          <label className="text-sm text-warm-text-light">頭像</label>
          <div className="flex gap-2 mt-1 flex-wrap">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-2xl p-1 rounded-lg transition-colors ${
                  avatar === a ? 'bg-mint/50 ring-2 ring-mint' : 'hover:bg-gray-100'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <button onClick={saveProfile} className="flex items-center gap-1 px-4 py-2 bg-mint rounded-full text-sm font-medium hover:bg-mint/80">
          <Save className="w-4 h-4" /> 儲存
        </button>
      </section>

      {/* AI Config */}
      <section className="bg-white/60 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-lg">🤖 AI 助手</h3>
        <p className="text-xs text-warm-text-light">提供 API Key 可啟用 AI 解題提示（Key 僅存於你的瀏覽器）</p>
        <div>
          <label className="text-sm text-warm-text-light">AI 供應商</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as 'openai' | 'gemini')}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-warm-text-light">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-... 或 AIza..."
            className="w-full mt-1 px-3 py-2 rounded-xl border border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>
        <button onClick={saveAI} className="flex items-center gap-1 px-4 py-2 bg-sky-light rounded-full text-sm font-medium hover:bg-sky/50">
          <Save className="w-4 h-4" /> 儲存 AI 設定
        </button>
      </section>

      {/* Stats */}
      <section className="bg-white/60 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-lg">📊 遊戲統計</h3>
        <p className="text-sm text-warm-text-light">總遊戲次數：{totalGames}</p>
        {Object.entries(bestScores).length > 0 ? (
          <ul className="space-y-1 text-sm">
            {Object.entries(bestScores).map(([key, score]) => (
              <li key={key} className="flex justify-between">
                <span>{key}</span>
                <span className="font-bold">{score} 分</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-warm-text-light">還沒有遊戲紀錄，快去玩吧！</p>
        )}
      </section>
    </div>
  )
}
