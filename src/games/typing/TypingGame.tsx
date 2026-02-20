import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Keyboard, Languages, PenLine, RotateCcw, Timer } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'

type LangMode = 'zh' | 'en'
type TrainMode = 'lesson' | 'article'

type Lesson = {
  id: string
  title: string
  description: string
  sequence: string[]
}

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

const EN_LESSONS: Lesson[] = [
  {
    id: 'en-home',
    title: 'English Lesson 1：Home Row',
    description: '先熟悉 A S D F / J K L 的基準位。',
    sequence: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'f', 'j', 'd', 'k', 's', 'l', 'a'],
  },
  {
    id: 'en-top',
    title: 'English Lesson 2：Top Row',
    description: '加入上排 Q W E R T / Y U I O P。',
    sequence: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'r', 't', 'y', 'u'],
  },
  {
    id: 'en-bottom',
    title: 'English Lesson 3：Bottom Row',
    description: '加入下排 Z X C V B N M，完成 26 鍵位練習。',
    sequence: ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'c', 'v', 'b', 'n', 'm'],
  },
]

const ZH_LESSONS: Lesson[] = [
  {
    id: 'zh-home',
    title: '注音 Lesson 1：中排鍵位',
    description: '熟悉中排注音：ㄇ ㄋ ㄎ ㄑ ㄘ ㄨ ㄜ ㄠ。',
    sequence: ['a', 's', 'd', 'f', 'h', 'j', 'k', 'l', 'f', 'j', 'd', 'k'],
  },
  {
    id: 'zh-top',
    title: '注音 Lesson 2：上排鍵位',
    description: '熟悉上排注音：ㄆ ㄊ ㄍ ㄐ ㄔ ㄗ ㄧ ㄛ ㄟ ㄣ。',
    sequence: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 't', 'y', 'u', 'i'],
  },
  {
    id: 'zh-bottom',
    title: '注音 Lesson 3：下排鍵位',
    description: '熟悉下排注音：ㄈ ㄌ ㄏ ㄒ ㄖ ㄙ ㄩ。',
    sequence: ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'v', 'b', 'n', 'm'],
  },
]

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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function TypingGame() {
  const difficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)

  const [lang, setLang] = useState<LangMode>('zh')
  const [mode, setMode] = useState<TrainMode>('lesson')

  const [selectedLesson, setSelectedLesson] = useState<string>('zh-home')
  const [lessonIndex, setLessonIndex] = useState(0)
  const [lessonMistakes, setLessonMistakes] = useState(0)

  const [articleText, setArticleText] = useState<string>(() => pickRandom(ZH_ARTICLES[difficulty]))
  const [articleInput, setArticleInput] = useState('')
  const [articleStartAt, setArticleStartAt] = useState<number | null>(null)
  const [articleDone, setArticleDone] = useState(false)

  const lessons = lang === 'zh' ? ZH_LESSONS : EN_LESSONS
  const currentLesson = lessons.find((l) => l.id === selectedLesson) ?? lessons[0]
  const expectedKey = currentLesson.sequence[lessonIndex]

  const expectedDisplay = lang === 'zh'
    ? `${ZHUYIN_BY_KEY[expectedKey] ?? ''}（${expectedKey.toUpperCase()}）`
    : expectedKey.toUpperCase()

  const resetLesson = (lessonId: string = currentLesson.id) => {
    setSelectedLesson(lessonId)
    setLessonIndex(0)
    setLessonMistakes(0)
  }

  const switchLang = (nextLang: LangMode) => {
    setLang(nextLang)
    setMode('lesson')
    const firstLesson = nextLang === 'zh' ? 'zh-home' : 'en-home'
    setSelectedLesson(firstLesson)
    setLessonIndex(0)
    setLessonMistakes(0)

    const nextArticle = nextLang === 'zh'
      ? pickRandom(ZH_ARTICLES[difficulty])
      : pickRandom(EN_ARTICLES[difficulty])
    setArticleText(nextArticle)
    setArticleInput('')
    setArticleStartAt(null)
    setArticleDone(false)
  }

  const onLessonInput = (value: string) => {
    const key = value.trim().toLowerCase().slice(-1)
    if (!key || !expectedKey) return

    if (key === expectedKey) {
      if (lessonIndex + 1 >= currentLesson.sequence.length) {
        setLessonIndex(0)
      } else {
        setLessonIndex((v) => v + 1)
      }
      return
    }
    setLessonMistakes((v) => v + 1)
  }

  const switchArticle = () => {
    const source = lang === 'zh' ? ZH_ARTICLES[difficulty] : EN_ARTICLES[difficulty]
    setArticleText(pickRandom(source))
    setArticleInput('')
    setArticleStartAt(null)
    setArticleDone(false)
  }

  const { correctChars, mistakes } = useMemo(() => {
    let correct = 0
    let wrong = 0
    for (let i = 0; i < articleInput.length; i++) {
      if (articleInput[i] === articleText[i]) correct += 1
      else wrong += 1
    }
    return { correctChars: correct, mistakes: wrong }
  }, [articleInput, articleText])

  const accuracy = articleInput.length === 0 ? 100 : Math.max(0, Math.round((correctChars / articleInput.length) * 100))
  const elapsedSec = articleStartAt ? Math.max(1, Math.floor((Date.now() - articleStartAt) / 1000)) : 0
  const cpm = elapsedSec > 0 ? Math.round((correctChars / elapsedSec) * 60) : 0

  const onArticleChange = (value: string) => {
    if (!articleStartAt && value.length > 0) setArticleStartAt(Date.now())
    if (articleDone) return

    setArticleInput(value)
    if (value === articleText) {
      const endSec = articleStartAt ? Math.max(1, Math.floor((Date.now() - articleStartAt) / 1000)) : 1
      const finalCpm = Math.round((articleText.length / endSec) * 60)
      const finalScore = Math.max(100, Math.round(finalCpm * 2 + accuracy * 5 - mistakes * 3 + difficulty * 10))
      addScore({ gameType: 'typing', difficulty, score: finalScore, durationSeconds: endSec })
      setArticleDone(true)
    }
  }

  return (
    <div className="w-full max-w-4xl bg-white/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => switchLang('zh')}
          className={`px-3 py-1.5 rounded-full text-sm ${lang === 'zh' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
        >
          <Languages className="inline w-4 h-4 mr-1" /> 中打（注音）
        </button>
        <button
          onClick={() => switchLang('en')}
          className={`px-3 py-1.5 rounded-full text-sm ${lang === 'en' ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
        >
          <Keyboard className="inline w-4 h-4 mr-1" /> 英打（26字母）
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setMode('lesson')}
          className={`px-3 py-1.5 rounded-full text-sm ${mode === 'lesson' ? 'bg-sky-light text-warm-text' : 'bg-white text-warm-text-light'}`}
        >
          <BookOpen className="inline w-4 h-4 mr-1" /> Lesson 鍵位訓練
        </button>
        <button
          onClick={() => setMode('article')}
          className={`px-3 py-1.5 rounded-full text-sm ${mode === 'article' ? 'bg-sky-light text-warm-text' : 'bg-white text-warm-text-light'}`}
        >
          <PenLine className="inline w-4 h-4 mr-1" /> 短文打字
        </button>
      </div>

      {mode === 'lesson' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => resetLesson(lesson.id)}
                className={`px-3 py-1.5 rounded-full text-sm ${selectedLesson === lesson.id ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
              >
                {lesson.title}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-cream-light p-4 space-y-2">
            <p className="font-semibold">{currentLesson.title}</p>
            <p className="text-sm text-warm-text-light">{currentLesson.description}</p>
            <p className="text-sm">目標按鍵：<b>{expectedDisplay}</b>｜建議手指：<b>{FINGER_HINT[expectedKey] ?? '依舒適手指'}</b></p>
            <p className="text-sm">進度：<b>{lessonIndex + 1}</b> / {currentLesson.sequence.length}｜錯誤：<b>{lessonMistakes}</b></p>
          </div>

          <input
            autoFocus
            onChange={(e) => { onLessonInput(e.target.value); e.currentTarget.value = '' }}
            placeholder={lang === 'zh' ? '請按對應注音的鍵位（輸入英文字母鍵）…' : 'Press the target key...'}
            className="w-full rounded-xl border border-mint/40 bg-white p-3 text-base focus:outline-none focus:ring-2 focus:ring-mint"
          />

          <div className="space-y-2 rounded-xl bg-white p-3">
            {KEY_ROWS.map((row) => (
              <div key={row} className="flex gap-1.5 justify-center">
                {row.split('').map((k) => {
                  const active = k === expectedKey
                  const inLesson = currentLesson.sequence.includes(k)
                  return (
                    <div
                      key={k}
                      className={`w-9 h-11 rounded-md border text-center text-xs flex flex-col items-center justify-center
                        ${active ? 'bg-mint border-mint-600 shadow' : inLesson ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <span className="font-bold text-sm">{k.toUpperCase()}</span>
                      <span className="text-[10px] text-warm-text-light">{ZHUYIN_BY_KEY[k] ?? ''}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <button onClick={() => resetLesson()} className="px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">
            <RotateCcw className="inline w-4 h-4 mr-1" /> 重置本 Lesson
          </button>
        </div>
      )}

      {mode === 'article' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={switchArticle} className="px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">更換短文</button>
          </div>

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
            <div className="bg-white rounded-lg p-2">正確字元：<b>{correctChars}</b></div>
            <div className="bg-white rounded-lg p-2">錯誤數：<b>{mistakes}</b></div>
            <div className="bg-white rounded-lg p-2">正確率：<b>{accuracy}%</b></div>
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
