import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Keyboard, Languages, Lock, PenLine, RotateCcw, Timer } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'

type LangMode = 'zh' | 'en'
type TrainMode = 'lesson' | 'article'

type Lesson = {
  id: string
  title: string
  description: string
  sequence: string[]
  passMaxSeconds: number
  passMinAccuracy: number
}

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const ALL_KEYS = 'abcdefghijklmnopqrstuvwxyz'.split('')

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

const EN_ARTICLES: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  1: ['My hands stay on home row. I type slowly and correctly.'],
  2: ['I look at the screen and keep my fingers relaxed. Small progress every day builds confidence.'],
  3: ['When I type, I keep a good posture and return to home row after each key press.'],
  4: ['Consistent typing practice improves both speed and accuracy, and helps me learn more efficiently at school.'],
  5: ['Effective keyboard skills come from discipline, precision, and mindful repetition across different key patterns.'],
}

const ZH_ARTICLES: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  1: ['我把手指放在基準位，慢慢打也沒關係，先打對最重要。'],
  2: ['練習打字時我會挺直坐好，眼睛看螢幕，手指打完再回到基準位。'],
  3: ['每天固定練習幾分鐘，打字會越來越穩，速度和正確率都會慢慢進步。'],
  4: ['良好的打字習慣可以幫助我更有效率地完成作業，也讓電腦操作更有自信。'],
  5: ['打字能力是長期累積的成果，重視節奏、姿勢與準確率，才能建立真正的基礎。'],
}

const BASE_LESSONS_EN: Omit<Lesson, 'sequence'>[] = [
  { id: 'en-l1', title: 'Lesson 1：Home Row', description: 'A S D F / J K L', passMaxSeconds: 20, passMinAccuracy: 90 },
  { id: 'en-l2', title: 'Lesson 2：Top Row', description: 'Q W E R T / Y U I O P', passMaxSeconds: 24, passMinAccuracy: 88 },
  { id: 'en-l3', title: 'Lesson 3：Bottom Row', description: 'Z X C V B N M', passMaxSeconds: 22, passMinAccuracy: 88 },
  { id: 'en-l4', title: 'Lesson 4：綜合隨機鍵位', description: '隨機提示 A-Z 鍵位', passMaxSeconds: 28, passMinAccuracy: 85 },
]

const BASE_LESSONS_ZH: Omit<Lesson, 'sequence'>[] = [
  { id: 'zh-l1', title: 'Lesson 1：中排注音', description: 'ㄇ ㄋ ㄎ ㄑ ㄘ ㄨ ㄜ ㄠ', passMaxSeconds: 20, passMinAccuracy: 90 },
  { id: 'zh-l2', title: 'Lesson 2：上排注音', description: 'ㄆ ㄊ ㄍ ㄐ ㄔ ㄗ ㄧ ㄛ ㄟ ㄣ', passMaxSeconds: 24, passMinAccuracy: 88 },
  { id: 'zh-l3', title: 'Lesson 3：下排注音', description: 'ㄈ ㄌ ㄏ ㄒ ㄖ ㄙ ㄩ', passMaxSeconds: 22, passMinAccuracy: 88 },
  { id: 'zh-l4', title: 'Lesson 4：綜合隨機鍵位', description: '隨機提示注音對應鍵位', passMaxSeconds: 30, passMinAccuracy: 85 },
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randomSequence(n: number) {
  return Array.from({ length: n }, () => pickRandom(ALL_KEYS))
}

function buildLessons(lang: LangMode): Lesson[] {
  if (lang === 'en') {
    return [
      { ...BASE_LESSONS_EN[0], sequence: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'f', 'j', 'd', 'k', 's', 'l', 'a'] },
      { ...BASE_LESSONS_EN[1], sequence: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'r', 't', 'y', 'u'] },
      { ...BASE_LESSONS_EN[2], sequence: ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'c', 'v', 'b', 'n', 'm'] },
      { ...BASE_LESSONS_EN[3], sequence: randomSequence(20) },
    ]
  }
  return [
    { ...BASE_LESSONS_ZH[0], sequence: ['a', 's', 'd', 'f', 'h', 'j', 'k', 'l', 'f', 'j', 'd', 'k'] },
    { ...BASE_LESSONS_ZH[1], sequence: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 't', 'y', 'u', 'i'] },
    { ...BASE_LESSONS_ZH[2], sequence: ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'v', 'b', 'n', 'm'] },
    { ...BASE_LESSONS_ZH[3], sequence: randomSequence(20) },
  ]
}

export default function TypingGame() {
  const difficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)

  const [lang, setLang] = useState<LangMode>('zh')
  const [mode, setMode] = useState<TrainMode>('lesson')
  const [lessons, setLessons] = useState<Lesson[]>(() => buildLessons('zh'))
  const [lessonIdx, setLessonIdx] = useState(0)
  const [unlockedIdx, setUnlockedIdx] = useState<{ zh: number; en: number }>({ zh: 0, en: 0 })

  const [keyIndex, setKeyIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [lessonStartAt, setLessonStartAt] = useState<number | null>(null)
  const [lessonFinished, setLessonFinished] = useState(false)
  const [lessonPassed, setLessonPassed] = useState(false)

  const [articleText, setArticleText] = useState<string>(() => pickRandom(ZH_ARTICLES[difficulty]))
  const [articleInput, setArticleInput] = useState('')
  const [articleStartAt, setArticleStartAt] = useState<number | null>(null)
  const [articleDone, setArticleDone] = useState(false)

  const currentLesson = lessons[lessonIdx]
  const expectedKey = currentLesson.sequence[keyIndex]

  const switchLang = (next: LangMode) => {
    setLang(next)
    setMode('lesson')
    const nextLessons = buildLessons(next)
    setLessons(nextLessons)
    setLessonIdx(0)
    resetLessonProgress()

    const source = next === 'zh' ? ZH_ARTICLES[difficulty] : EN_ARTICLES[difficulty]
    setArticleText(pickRandom(source))
    setArticleInput('')
    setArticleStartAt(null)
    setArticleDone(false)
  }

  function resetLessonProgress() {
    setKeyIndex(0)
    setCorrectCount(0)
    setMistakeCount(0)
    setLessonStartAt(null)
    setLessonFinished(false)
    setLessonPassed(false)
  }

  const selectLesson = (idx: number) => {
    if (idx > unlockedIdx[lang]) return
    setLessonIdx(idx)
    resetLessonProgress()
    if (idx === 3) {
      const nextLessons = [...lessons]
      nextLessons[3] = { ...nextLessons[3], sequence: randomSequence(20) }
      setLessons(nextLessons)
    }
  }

  const onLessonInput = (value: string) => {
    if (lessonFinished) return
    const key = value.trim().toLowerCase().slice(-1)
    if (!key || !expectedKey) return
    if (!lessonStartAt) setLessonStartAt(Date.now())

    if (key === expectedKey) {
      const nextCorrect = correctCount + 1
      setCorrectCount(nextCorrect)
      if (keyIndex + 1 >= currentLesson.sequence.length) {
        const sec = lessonStartAt ? Math.max(1, Math.floor((Date.now() - lessonStartAt) / 1000)) : 1
        const acc = Math.round((nextCorrect / (nextCorrect + mistakeCount)) * 100)
        const passed = sec <= currentLesson.passMaxSeconds && acc >= currentLesson.passMinAccuracy
        setLessonFinished(true)
        setLessonPassed(passed)

        addScore({
          gameType: 'typing',
          difficulty,
          score: Math.max(80, Math.round(acc * 4 + (currentLesson.passMaxSeconds - Math.min(sec, currentLesson.passMaxSeconds)) * 8)),
          durationSeconds: sec,
        })

        if (passed && lessonIdx < 3) {
          setUnlockedIdx((prev) => ({ ...prev, [lang]: Math.max(prev[lang], lessonIdx + 1) }))
        }
        return
      }
      setKeyIndex((v) => v + 1)
    } else {
      setMistakeCount((v) => v + 1)
    }
  }

  const retryLesson = () => {
    if (lessonIdx === 3) {
      const nextLessons = [...lessons]
      nextLessons[3] = { ...nextLessons[3], sequence: randomSequence(20) }
      setLessons(nextLessons)
    }
    resetLessonProgress()
  }

  const lessonElapsed = lessonStartAt ? Math.max(1, Math.floor((Date.now() - lessonStartAt) / 1000)) : 0
  const lessonAccuracy = correctCount + mistakeCount === 0 ? 100 : Math.round((correctCount / (correctCount + mistakeCount)) * 100)

  const switchArticle = () => {
    const source = lang === 'zh' ? ZH_ARTICLES[difficulty] : EN_ARTICLES[difficulty]
    setArticleText(pickRandom(source))
    setArticleInput('')
    setArticleStartAt(null)
    setArticleDone(false)
  }

  const { artCorrect, artMistakes } = useMemo(() => {
    let c = 0
    let m = 0
    for (let i = 0; i < articleInput.length; i++) {
      if (articleInput[i] === articleText[i]) c += 1
      else m += 1
    }
    return { artCorrect: c, artMistakes: m }
  }, [articleInput, articleText])

  const artAcc = articleInput.length === 0 ? 100 : Math.max(0, Math.round((artCorrect / articleInput.length) * 100))
  const artSec = articleStartAt ? Math.max(1, Math.floor((Date.now() - articleStartAt) / 1000)) : 0
  const cpm = artSec > 0 ? Math.round((artCorrect / artSec) * 60) : 0

  const onArticleChange = (value: string) => {
    if (!articleStartAt && value.length > 0) setArticleStartAt(Date.now())
    if (articleDone) return
    setArticleInput(value)

    if (value === articleText) {
      const sec = articleStartAt ? Math.max(1, Math.floor((Date.now() - articleStartAt) / 1000)) : 1
      const finalCpm = Math.round((articleText.length / sec) * 60)
      const finalScore = Math.max(100, Math.round(finalCpm * 2 + artAcc * 5 - artMistakes * 3 + difficulty * 10))
      addScore({ gameType: 'typing', difficulty, score: finalScore, durationSeconds: sec })
      setArticleDone(true)
    }
  }

  const expectedDisplay = lang === 'zh'
    ? `${ZHUYIN_BY_KEY[expectedKey] ?? ''}（${expectedKey?.toUpperCase() ?? ''}）`
    : expectedKey?.toUpperCase() ?? ''

  return (
    <div className="w-full max-w-4xl bg-white/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => switchLang('zh')} className={`px-3 py-1.5 rounded-full text-sm ${lang === 'zh' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}>
          <Languages className="inline w-4 h-4 mr-1" /> 中打（注音）
        </button>
        <button onClick={() => switchLang('en')} className={`px-3 py-1.5 rounded-full text-sm ${lang === 'en' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}>
          <Keyboard className="inline w-4 h-4 mr-1" /> 英打（26字母）
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setMode('lesson')} className={`px-3 py-1.5 rounded-full text-sm ${mode === 'lesson' ? 'bg-sky-light text-warm-text' : 'bg-white text-warm-text-light'}`}>
          <BookOpen className="inline w-4 h-4 mr-1" /> Lesson 鍵位訓練
        </button>
        <button onClick={() => setMode('article')} className={`px-3 py-1.5 rounded-full text-sm ${mode === 'article' ? 'bg-sky-light text-warm-text' : 'bg-white text-warm-text-light'}`}>
          <PenLine className="inline w-4 h-4 mr-1" /> 短文打字
        </button>
      </div>

      {mode === 'lesson' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {lessons.map((lesson, idx) => {
              const locked = idx > unlockedIdx[lang]
              return (
                <button
                  key={lesson.id}
                  disabled={locked}
                  onClick={() => selectLesson(idx)}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${lessonIdx === idx ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'} ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {locked && <Lock className="w-3 h-3" />} {lesson.title}
                </button>
              )
            })}
          </div>

          <div className="rounded-xl bg-cream-light p-4 space-y-1">
            <p className="font-semibold">{currentLesson.title}</p>
            <p className="text-sm text-warm-text-light">{currentLesson.description}</p>
            <p className="text-sm">目標鍵：<b>{expectedDisplay}</b>｜建議手指：<b>{FINGER_HINT[expectedKey] ?? '依舒適手指'}</b></p>
            <p className="text-sm">進度：<b>{keyIndex + 1}</b> / {currentLesson.sequence.length}｜錯誤：<b>{mistakeCount}</b></p>
            <p className="text-xs text-warm-text-light">達標：{currentLesson.passMaxSeconds} 秒內，正確率 ≥ {currentLesson.passMinAccuracy}%</p>
          </div>

          <input
            autoFocus
            onChange={(e) => { onLessonInput(e.target.value); e.currentTarget.value = '' }}
            placeholder={lang === 'zh' ? '請按對應注音鍵位（輸入英文字母鍵）…' : 'Press the target key...'}
            className="w-full rounded-xl border border-mint/40 bg-white p-3 text-base focus:outline-none focus:ring-2 focus:ring-mint"
          />

          <div className="space-y-2 rounded-xl bg-white p-3">
            {KEY_ROWS.map((row) => (
              <div key={row} className="flex gap-1.5 justify-center">
                {row.split('').map((k) => {
                  const active = k === expectedKey
                  const inLesson = currentLesson.sequence.includes(k)
                  return (
                    <div key={k} className={`w-9 h-11 rounded-md border text-center text-xs flex flex-col items-center justify-center ${active ? 'bg-mint border-mint-600 shadow' : inLesson ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'}`}>
                      <span className="font-bold text-sm">{k.toUpperCase()}</span>
                      <span className="text-[10px] text-warm-text-light">{ZHUYIN_BY_KEY[k] ?? ''}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {lessonFinished && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-3 text-sm ${lessonPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {lessonPassed ? '✅ 通關成功！' : '⚠️ 未達標，請再挑戰一次。'}
              <div>成績：{lessonElapsed} 秒｜正確率 {lessonAccuracy}%</div>
            </motion.div>
          )}

          <button onClick={retryLesson} className="px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">
            <RotateCcw className="inline w-4 h-4 mr-1" /> 重試本 Lesson
          </button>
        </div>
      )}

      {mode === 'article' && (
        <div className="space-y-4">
          <button onClick={switchArticle} className="px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">更換短文</button>

          <div className="rounded-xl bg-cream-light p-4 leading-relaxed text-lg tracking-wide min-h-24">
            {articleText.split('').map((ch, idx) => {
              const typed = articleInput[idx]
              let cls = 'text-warm-text'
              if (typed != null) cls = typed === ch ? 'text-emerald-600' : 'text-red-500 bg-red-100 rounded'
              return <span key={`${ch}-${idx}`} className={cls}>{ch}</span>
            })}
          </div>

          <textarea
            value={articleInput}
            onChange={(e) => onArticleChange(e.target.value)}
            placeholder={lang === 'zh' ? '請輸入上方短文…' : 'Type the short article above...'}
            className="w-full min-h-32 rounded-xl border border-mint/40 bg-white p-3 text-base focus:outline-none focus:ring-2 focus:ring-mint"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div className="bg-white rounded-lg p-2">正確字元：<b>{artCorrect}</b></div>
            <div className="bg-white rounded-lg p-2">錯誤數：<b>{artMistakes}</b></div>
            <div className="bg-white rounded-lg p-2">正確率：<b>{artAcc}%</b></div>
            <div className="bg-white rounded-lg p-2 flex items-center gap-1"><Timer className="w-4 h-4" />CPM：<b>{cpm}</b></div>
          </div>

          {articleDone && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-mint rounded-xl p-3 text-center">
              <CheckCircle2 className="inline w-4 h-4 mr-1" /> 短文完成！可再換一篇持續練習。
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
