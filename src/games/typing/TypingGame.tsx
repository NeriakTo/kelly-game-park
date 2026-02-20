import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Keyboard, Languages, PenLine, RotateCcw, Timer, Hand } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'

type Stage = 'guide-en' | 'guide-zh' | 'sentence'
type LangMode = 'zh' | 'en'

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

const ZHUYIN_BY_KEY: Record<string, string> = {
  q: 'ㄆ', w: 'ㄊ', e: 'ㄍ', r: 'ㄐ', t: 'ㄔ', y: 'ㄗ', u: 'ㄧ', i: 'ㄛ', o: 'ㄟ', p: 'ㄣ',
  a: 'ㄇ', s: 'ㄋ', d: 'ㄎ', f: 'ㄑ', g: 'ㄕ', h: 'ㄘ', j: 'ㄨ', k: 'ㄜ', l: 'ㄠ',
  z: 'ㄈ', x: 'ㄌ', c: 'ㄏ', v: 'ㄒ', b: 'ㄖ', n: 'ㄙ', m: 'ㄩ',
}

const FINGER_HINT: Record<string, string> = {
  q: '左手小指', a: '左手小指', z: '左手小指',
  w: '左手無名指', s: '左手無名指', x: '左手無名指',
  e: '左手中指', d: '左手中指', c: '左手中指',
  r: '左手食指', f: '左手食指', v: '左手食指', t: '左手食指', g: '左手食指', b: '左手食指',
  y: '右手食指', h: '右手食指', n: '右手食指', u: '右手食指', j: '右手食指', m: '右手食指',
  i: '右手中指', k: '右手中指',
  o: '右手無名指', l: '右手無名指',
  p: '右手小指',
}

const GUIDE_SEQUENCE = [
  // 先 home row，再擴展到全鍵區
  'f', 'j', 'd', 'k', 's', 'l', 'a',
  'g', 'h', 'q', 'w', 'e', 'r', 't',
  'y', 'u', 'i', 'o', 'p', 'z', 'x',
  'c', 'v', 'b', 'n', 'm',
]

const HOME_ROW_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l']

const SENTENCES: Record<LangMode, string[]> = {
  zh: [
    '我今天練習正確打字姿勢',
    '先慢慢打對再慢慢加快',
    '手指放好位置就不會亂掉',
  ],
  en: [
    'I practice keyboard skills every day',
    'Slow and correct typing is important',
    'My fingers return to home row keys',
  ],
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function TypingGame() {
  const difficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)

  const [stage, setStage] = useState<Stage>('guide-en')
  const [guideIndex, setGuideIndex] = useState(0)
  const [guideMistakes, setGuideMistakes] = useState(0)

  const [sentenceMode, setSentenceMode] = useState<LangMode>('zh')
  const [target, setTarget] = useState(() => randomPick(SENTENCES.zh))
  const [input, setInput] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)

  const expectedKey = GUIDE_SEQUENCE[guideIndex]
  const expectedDisplay = stage === 'guide-zh' ? ZHUYIN_BY_KEY[expectedKey] : expectedKey.toUpperCase()

  const guideProgress = Math.round((guideIndex / GUIDE_SEQUENCE.length) * 100)

  const onGuideInput = (value: string) => {
    const last = value.trim().toLowerCase().slice(-1)
    if (!last) return

    if (last === expectedKey) {
      if (guideIndex + 1 >= GUIDE_SEQUENCE.length) {
        if (stage === 'guide-en') {
          setStage('guide-zh')
          setGuideIndex(0)
          return
        }
        setStage('sentence')
        setGuideIndex(0)
        return
      }
      setGuideIndex((v) => v + 1)
    } else {
      setGuideMistakes((v) => v + 1)
    }
  }

  const resetGuide = () => {
    setGuideIndex(0)
    setGuideMistakes(0)
  }

  const resetSentence = (mode: LangMode = sentenceMode) => {
    setSentenceMode(mode)
    setTarget(randomPick(SENTENCES[mode]))
    setInput('')
    setStartedAt(null)
    setFinished(false)
  }

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

  const onSentenceChange = (value: string) => {
    if (!startedAt && value.length > 0) setStartedAt(Date.now())
    if (finished) return

    setInput(value)
    if (value === target) {
      const endSec = startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : 1
      const finalCpm = Math.round((target.length / endSec) * 60)
      const finalScore = Math.max(100, Math.round(finalCpm * 2 + accuracy * 5 - mistakes * 3 + difficulty * 10))
      addScore({ gameType: 'typing', difficulty, score: finalScore, durationSeconds: endSec })
      setFinished(true)
    }
  }

  return (
    <div className="w-full max-w-4xl bg-white/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 relative">
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/30 rounded-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-xl"
            >
              <h3 className="text-lg font-bold mb-2">👋 打字練習導覽</h3>
              <ol className="text-sm text-warm-text-light space-y-1 list-decimal list-inside">
                <li>先練英文字母鍵位（A~Z）</li>
                <li>再練注音對應鍵位（使用同一鍵盤位置）</li>
                <li>最後進入文章打字，練速度與正確率</li>
                <li>重點：手指回到 Home Row（A S D F / J K L）</li>
              </ol>
              <button
                onClick={() => setShowOnboarding(false)}
                className="mt-4 px-4 py-2 rounded-full bg-mint text-warm-text font-medium hover:bg-mint/80"
              >
                開始練習
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setStage('guide-en'); resetGuide() }}
          className={`px-3 py-1.5 rounded-full text-sm ${stage === 'guide-en' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
        >
          <Keyboard className="inline w-4 h-4 mr-1" /> 英文鍵位引導
        </button>
        <button
          onClick={() => { setStage('guide-zh'); resetGuide() }}
          className={`px-3 py-1.5 rounded-full text-sm ${stage === 'guide-zh' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
        >
          <Languages className="inline w-4 h-4 mr-1" /> 注音鍵位引導
        </button>
        <button
          onClick={() => setStage('sentence')}
          className={`px-3 py-1.5 rounded-full text-sm ${stage === 'sentence' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
        >
          <PenLine className="inline w-4 h-4 mr-1" /> 文章練習
        </button>
      </div>

      {(stage === 'guide-en' || stage === 'guide-zh') && (
        <div className="space-y-4">
          <div className="rounded-xl bg-cream-light p-4 space-y-2">
            <p className="text-sm text-warm-text-light">步驟引導：先熟悉鍵位，再進入文章打字</p>
            <p className="text-sm flex items-center gap-1"><Hand className="w-4 h-4" /> 手指基準位：<b>A S D F</b>（左手） / <b>J K L</b>（右手）</p>
            <div className="flex flex-wrap gap-1">
              {HOME_ROW_KEYS.map((k) => (
                <span key={k} className="px-2 py-0.5 rounded-md bg-white text-xs font-semibold">{k.toUpperCase()}</span>
              ))}
            </div>
            <p className="mt-2 text-lg">
              目標按鍵：
              <span className="ml-2 inline-flex items-center justify-center min-w-10 px-3 py-1 rounded-lg bg-mint font-bold">
                {expectedDisplay}
              </span>
            </p>
            <p className="text-sm mt-2">建議手指：<b>{FINGER_HINT[expectedKey] ?? '依舒適手指'}</b></p>
            <p className="text-sm mt-1">進度：<b>{guideIndex}</b> / {GUIDE_SEQUENCE.length}（{guideProgress}%）｜錯誤：<b>{guideMistakes}</b></p>
          </div>

          <input
            autoFocus
            onChange={(e) => { onGuideInput(e.target.value); e.currentTarget.value = '' }}
            placeholder={stage === 'guide-en' ? '請按目標英文字母鍵…' : '請按對應注音的鍵位（用英文字母鍵）…'}
            className="w-full rounded-xl border border-mint/40 bg-white p-3 text-base focus:outline-none focus:ring-2 focus:ring-mint"
          />

          <div className="space-y-2 rounded-xl bg-white p-3">
            {KEY_ROWS.map((row) => (
              <div key={row} className="flex gap-1.5 justify-center">
                {row.split('').map((k) => {
                  const active = k === expectedKey
                  return (
                    <div
                      key={k}
                      className={`w-9 h-11 rounded-md border text-center text-xs flex flex-col items-center justify-center ${active ? 'bg-mint border-mint-600 shadow' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <span className="font-bold text-sm">{k.toUpperCase()}</span>
                      <span className="text-[10px] text-warm-text-light">{ZHUYIN_BY_KEY[k] ?? ''}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <button onClick={resetGuide} className="px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">
            <RotateCcw className="inline w-4 h-4 mr-1" /> 重新引導
          </button>
        </div>
      )}

      {stage === 'sentence' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => resetSentence('zh')} className={`px-3 py-1.5 rounded-full text-sm ${sentenceMode === 'zh' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}>中文句子</button>
            <button onClick={() => resetSentence('en')} className={`px-3 py-1.5 rounded-full text-sm ${sentenceMode === 'en' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}>English Sentences</button>
            <button onClick={() => resetSentence()} className="px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">換題目</button>
          </div>

          <div className="rounded-xl bg-cream-light p-4 leading-relaxed text-lg tracking-wide min-h-20">
            {target.split('').map((ch, idx) => {
              const typed = input[idx]
              let cls = 'text-warm-text'
              if (typed != null) cls = typed === ch ? 'text-emerald-600' : 'text-red-500 bg-red-100 rounded'
              return <span key={`${ch}-${idx}`} className={cls}>{ch}</span>
            })}
          </div>

          <textarea
            value={input}
            onChange={(e) => onSentenceChange(e.target.value)}
            placeholder={sentenceMode === 'zh' ? '在這裡輸入上方句子…' : 'Type the sentence above here...'}
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
              <CheckCircle2 className="inline w-4 h-4 mr-1" /> 完成！你可以再換一題，或回去練鍵位。
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
