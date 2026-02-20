import { useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Timer } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'

type Mode = 'zh' | 'en'

const TEXTS: Record<Mode, Record<1 | 2 | 3 | 4 | 5, string[]>> = {
  zh: {
    1: ['小貓愛吃魚', '今天陽光很好', '我們一起學習'],
    2: ['我和同學去公園玩球', '請把書包放在桌子旁邊', '每天閱讀會變更聰明'],
    3: ['我喜歡觀察雲朵慢慢飄過天空', '努力練習可以讓打字越來越快', '完成作業後我們一起玩遊戲'],
    4: ['良好的時間管理能幫助我平衡學習與休息', '遇到困難時先冷靜分析再一步步解決', '每天進步一點點長期就會有很大改變'],
    5: ['持續訓練打字準確率比盲目追求速度更重要', '清楚的表達與邏輯思考是跨領域學習的核心能力', '專注與紀律能在長期目標中產生可觀的複利效果'],
  },
  en: {
    1: ['I like cats', 'The sun is warm', 'We play and learn'],
    2: ['Please put your book on the desk', 'I practice typing every day', 'My family walks in the park'],
    3: ['Good habits make school life easier', 'I can type better with daily practice', 'Learning with friends is fun and helpful'],
    4: ['Clear goals help me focus on important tasks', 'Small progress each day builds strong confidence', 'I solve problems by thinking step by step'],
    5: ['Accurate typing creates a solid foundation for speed', 'Consistent practice develops both focus and resilience', 'Effective communication requires clarity structure and empathy'],
  },
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function TypingGame() {
  const difficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)
  const [mode, setMode] = useState<Mode>('zh')
  const [target, setTarget] = useState(() => pickRandom(TEXTS.zh[difficulty]))
  const [input, setInput] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)

  const reset = useCallback((nextMode: Mode = mode) => {
    setTarget(pickRandom(TEXTS[nextMode][difficulty]))
    setInput('')
    setStartedAt(null)
    setFinished(false)
  }, [mode, difficulty])

  const { correctChars, mistakes } = useMemo(() => {
    let correct = 0
    let wrong = 0
    for (let i = 0; i < input.length; i++) {
      if (input[i] === target[i]) correct += 1
      else wrong += 1
    }
    return { correctChars: correct, mistakes: wrong }
  }, [input, target])

  const accuracy = input.length === 0 ? 100 : Math.max(0, Math.round((correctChars / input.length) * 100))
  const elapsedSec = startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : 0
  const cpm = elapsedSec > 0 ? Math.round((correctChars / elapsedSec) * 60) : 0

  const onChangeInput = (value: string) => {
    if (!startedAt && value.length > 0) setStartedAt(Date.now())
    if (finished) return

    setInput(value)
    if (value === target) {
      const endSec = startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : 1
      const finalCpm = Math.round((target.length / endSec) * 60)
      const finalScore = Math.max(100, Math.round(finalCpm * 2 + accuracy * 5 - mistakes * 3))
      addScore({
        gameType: 'typing',
        difficulty,
        score: finalScore,
        durationSeconds: endSec,
      })
      setFinished(true)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setTarget(pickRandom(TEXTS[next][difficulty]))
    setInput('')
    setStartedAt(null)
    setFinished(false)
  }

  return (
    <div className="w-full max-w-3xl bg-white/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => switchMode('zh')}
            className={`px-3 py-1.5 rounded-full text-sm ${mode === 'zh' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
          >
            中文模式
          </button>
          <button
            onClick={() => switchMode('en')}
            className={`px-3 py-1.5 rounded-full text-sm ${mode === 'en' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
          >
            English Mode
          </button>
        </div>

        <button onClick={() => reset()} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">
          <RefreshCw className="w-4 h-4" /> 換一句
        </button>
      </div>

      <div className="rounded-xl bg-cream-light p-4 leading-relaxed text-lg tracking-wide min-h-20">
        {target.split('').map((ch, idx) => {
          const typed = input[idx]
          let cls = 'text-warm-text'
          if (typed != null) cls = typed === ch ? 'text-emerald-600' : 'text-red-500 bg-red-100 rounded'
          return (
            <span key={`${ch}-${idx}`} className={cls}>{ch}</span>
          )
        })}
      </div>

      <textarea
        value={input}
        onChange={(e) => onChangeInput(e.target.value)}
        placeholder={mode === 'zh' ? '在這裡輸入上方句子…' : 'Type the sentence above here...'}
        className="w-full min-h-28 rounded-xl border border-mint/40 bg-white p-3 text-base focus:outline-none focus:ring-2 focus:ring-mint"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="bg-white rounded-lg p-2">正確字元：<b>{correctChars}</b></div>
        <div className="bg-white rounded-lg p-2">錯誤數：<b>{mistakes}</b></div>
        <div className="bg-white rounded-lg p-2">正確率：<b>{accuracy}%</b></div>
        <div className="bg-white rounded-lg p-2 flex items-center gap-1"><Timer className="w-4 h-4" />CPM：<b>{cpm}</b></div>
      </div>

      {finished && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-mint rounded-xl p-3 text-center">
          🎉 完成！你真厲害！可以按「換一句」繼續挑戰。
        </motion.div>
      )}
    </div>
  )
}
