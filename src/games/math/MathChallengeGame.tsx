import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, RotateCcw, XCircle, BookOpen, Target } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import type { Difficulty } from '../../types'

type UnitId =
  | 'low-add'
  | 'low-sub'
  | 'low-multi-concept'
  | 'mid-mul'
  | 'mid-div'
  | 'mid-mixed'
  | 'high-decimal'
  | 'high-fraction'
  | 'high-mixed'

type Unit = {
  id: UnitId
  name: string
  description: string
}

type Problem = {
  text: string
  answer: number
  hint: string
  unitId: UnitId
}

const WRONG_BOOK_KEY = 'kelly-math-wrong-book-v1'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function toElementaryDifficulty(difficulty: Difficulty): 1 | 2 | 3 {
  if (difficulty <= 1) return 1
  if (difficulty === 2) return 2
  return 3
}

function getUnitsByDifficulty(difficulty: 1 | 2 | 3): Unit[] {
  if (difficulty === 1) {
    return [
      { id: 'low-add', name: '100 內加法', description: '小二核心：進位與心算加法' },
      { id: 'low-sub', name: '100 內減法', description: '小二核心：退位與借位減法' },
      { id: 'low-multi-concept', name: '倍數概念', description: '重複加法與乘法概念連結' },
    ]
  }
  if (difficulty === 2) {
    return [
      { id: 'mid-mul', name: '乘法練習', description: '乘法表與乘法運算' },
      { id: 'mid-div', name: '除法練習', description: '由乘法反推除法' },
      { id: 'mid-mixed', name: '四則混合', description: '先乘除後加減' },
    ]
  }
  return [
    { id: 'high-decimal', name: '小數運算', description: '小數加減與位值概念' },
    { id: 'high-fraction', name: '分數基礎', description: '同分母分數與小數轉換' },
    { id: 'high-mixed', name: '綜合應用', description: '小數/分數/四則整合' },
  ]
}

function generateUnitProblem(unitId: UnitId): Problem {
  switch (unitId) {
    case 'low-add': {
      const a = rand(10, 99)
      const b = rand(1, 30)
      return { text: `${a} + ${b} = ?`, answer: a + b, hint: '先算十位，再算個位。', unitId }
    }
    case 'low-sub': {
      const a = rand(20, 99)
      const b = rand(1, Math.min(40, a - 1))
      return { text: `${a} - ${b} = ?`, answer: a - b, hint: '借位時十位先減 1。', unitId }
    }
    case 'low-multi-concept': {
      const n = rand(2, 9)
      const times = rand(2, 4)
      return {
        text: `${n}${times === 2 ? ' + ' + n : times === 3 ? ' + ' + n + ' + ' + n : ' + ' + n + ' + ' + n + ' + ' + n} = ?`,
        answer: n * times,
        hint: '這是重複加法，也可想成乘法。',
        unitId,
      }
    }
    case 'mid-mul': {
      const a = rand(2, 12)
      const b = rand(2, 12)
      return { text: `${a} × ${b} = ?`, answer: a * b, hint: '先想乘法表。', unitId }
    }
    case 'mid-div': {
      const b = rand(2, 12)
      const ans = rand(2, 12)
      return { text: `${b * ans} ÷ ${b} = ?`, answer: ans, hint: '除法可反推乘法。', unitId }
    }
    case 'mid-mixed': {
      const a = rand(10, 60)
      const b = rand(2, 9)
      const c = rand(2, 9)
      return { text: `${a} + ${b} × ${c} = ?`, answer: a + b * c, hint: '先乘除，後加減。', unitId }
    }
    case 'high-decimal': {
      const a = rand(1, 9)
      const b = rand(1, 9)
      return {
        text: `0.${a} + 0.${b} = ?（小數一位）`,
        answer: Number((a / 10 + b / 10).toFixed(1)),
        hint: '小數點要對齊。',
        unitId,
      }
    }
    case 'high-fraction': {
      const a = rand(1, 8)
      const b = rand(1, 8)
      return {
        text: `${a}/10 + ${b}/10 = ?（小數一位）`,
        answer: Number(((a + b) / 10).toFixed(1)),
        hint: '同分母分數先加分子。',
        unitId,
      }
    }
    case 'high-mixed':
    default: {
      const type = rand(1, 2)
      if (type === 1) {
        const a = rand(20, 99)
        const b = rand(2, 9)
        const c = rand(2, 9)
        return { text: `${a} - ${b} × ${c} = ?`, answer: a - b * c, hint: '先乘法，再減法。', unitId }
      }
      const b = rand(2, 9)
      const ans = rand(3, 12)
      return { text: `${b * ans} ÷ ${b} + 7 = ?`, answer: ans + 7, hint: '先除法，再加法。', unitId }
    }
  }
}

function buildOptions(answer: number, elementaryDifficulty: 1 | 2 | 3): number[] {
  const deltaPool = elementaryDifficulty === 1 ? [1, 2, 3, 5, 10] : elementaryDifficulty === 2 ? [1, 2, 3, 4, 6, 9] : [0.1, 0.2, 0.3, 0.5, 1, 2]
  const options = new Set<number>([answer])

  while (options.size < 4) {
    const delta = deltaPool[rand(0, deltaPool.length - 1)]
    const sign = Math.random() < 0.5 ? -1 : 1
    const candidate = Number((answer + sign * delta).toFixed(1))
    if (candidate !== answer) options.add(candidate)
  }

  return Array.from(options).sort(() => Math.random() - 0.5)
}

function loadWrongBook(): Record<string, Problem[]> {
  try {
    const raw = localStorage.getItem(WRONG_BOOK_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveWrongBook(book: Record<string, Problem[]>) {
  try {
    localStorage.setItem(WRONG_BOOK_KEY, JSON.stringify(book))
  } catch {}
}

export default function MathChallengeGame() {
  const difficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)

  const elementaryDifficulty = toElementaryDifficulty(difficulty)
  const units = useMemo(() => getUnitsByDifficulty(elementaryDifficulty), [elementaryDifficulty])

  const [selectedUnitId, setSelectedUnitId] = useState<UnitId>(units[0].id)
  const [mode, setMode] = useState<'normal' | 'wrong-review'>('normal')

  const [wrongBook, setWrongBook] = useState<Record<string, Problem[]>>(() => loadWrongBook())

  const buildNextProblem = (unitId: UnitId, nextMode: 'normal' | 'wrong-review'): Problem => {
    const key = `${elementaryDifficulty}-${unitId}`
    if (nextMode === 'wrong-review') {
      const bucket = wrongBook[key] ?? []
      if (bucket.length > 0) return bucket[rand(0, bucket.length - 1)]
    }
    return generateUnitProblem(unitId)
  }

  const [problem, setProblem] = useState<Problem>(() => buildNextProblem(units[0].id, 'normal'))
  const [options, setOptions] = useState<number[]>(() => buildOptions(problem.answer, elementaryDifficulty))

  const [questionNo, setQuestionNo] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [startAt, setStartAt] = useState(Date.now())
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [finished, setFinished] = useState(false)
  const [locked, setLocked] = useState(false)

  const total = 10
  const answered = correct + wrong
  const accuracy = answered === 0 ? 100 : Math.round((correct / answered) * 100)
  const durationSec = Math.max(1, Math.floor((Date.now() - startAt) / 1000))

  const wrongKey = `${elementaryDifficulty}-${selectedUnitId}`
  const wrongCount = (wrongBook[wrongKey] ?? []).length

  const gradeGuide = useMemo(() => {
    if (elementaryDifficulty === 1) return '國小低年級（含小二）單元化練習：加法、減法、倍數概念'
    if (elementaryDifficulty === 2) return '國小中年級單元化練習：乘法、除法、四則混合'
    return '國小高年級單元化練習：小數、分數、綜合應用'
  }, [elementaryDifficulty])

  const resetRun = (unitId: UnitId = selectedUnitId, nextMode: 'normal' | 'wrong-review' = mode) => {
    const first = buildNextProblem(unitId, nextMode)
    setProblem(first)
    setOptions(buildOptions(first.answer, elementaryDifficulty))
    setQuestionNo(1)
    setCorrect(0)
    setWrong(0)
    setStartAt(Date.now())
    setFeedback(null)
    setShowHint(false)
    setFinished(false)
    setLocked(false)
  }

  const addWrongProblem = (p: Problem) => {
    const key = `${elementaryDifficulty}-${p.unitId}`
    const prev = wrongBook[key] ?? []
    const exists = prev.some((x) => x.text === p.text && x.answer === p.answer)
    const nextBook = {
      ...wrongBook,
      [key]: exists ? prev : [...prev, p].slice(-30),
    }
    setWrongBook(nextBook)
    saveWrongBook(nextBook)
  }

  const removeWrongProblem = (p: Problem) => {
    const key = `${elementaryDifficulty}-${p.unitId}`
    const prev = wrongBook[key] ?? []
    const next = prev.filter((x) => !(x.text === p.text && x.answer === p.answer))
    const nextBook = { ...wrongBook, [key]: next }
    setWrongBook(nextBook)
    saveWrongBook(nextBook)
  }

  const nextQuestion = (nextNo: number) => {
    const next = buildNextProblem(selectedUnitId, mode)
    setQuestionNo(nextNo)
    setProblem(next)
    setOptions(buildOptions(next.answer, elementaryDifficulty))
    setFeedback(null)
    setShowHint(false)
    setLocked(false)
  }

  const submitOption = (choice: number) => {
    if (finished || locked) return
    setLocked(true)

    const ok = Math.abs(choice - problem.answer) < 0.0001
    setFeedback(ok ? 'correct' : 'wrong')

    const nextCorrect = ok ? correct + 1 : correct
    const nextWrong = ok ? wrong : wrong + 1
    setCorrect(nextCorrect)
    setWrong(nextWrong)

    if (!ok) addWrongProblem(problem)
    if (ok && mode === 'wrong-review') removeWrongProblem(problem)

    const nextNo = questionNo + 1
    if (nextNo > total) {
      const finalAcc = Math.round((nextCorrect / total) * 100)
      const finalScore = Math.max(100, Math.round(nextCorrect * 120 + finalAcc * 8 - durationSec))
      addScore({ gameType: 'math', difficulty: elementaryDifficulty, score: finalScore, durationSeconds: durationSec })
      setFinished(true)
      return
    }

    setTimeout(() => nextQuestion(nextNo), 700)
  }

  const onSelectUnit = (unitId: UnitId) => {
    setSelectedUnitId(unitId)
    setMode('normal')
    resetRun(unitId, 'normal')
  }

  const switchMode = (nextMode: 'normal' | 'wrong-review') => {
    setMode(nextMode)
    resetRun(selectedUnitId, nextMode)
  }

  const canReviewWrong = wrongCount > 0

  return (
    <div className="w-full max-w-4xl bg-white/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="rounded-xl bg-cream-light p-3 text-sm text-warm-text-light">{gradeGuide}</div>

      <div className="flex flex-wrap gap-2">
        {units.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelectUnit(u.id)}
            className={`px-3 py-1.5 rounded-full text-sm ${selectedUnitId === u.id ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
          >
            {u.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => switchMode('normal')}
          className={`px-3 py-1.5 rounded-full text-sm ${mode === 'normal' ? 'bg-sky-light text-warm-text' : 'bg-white text-warm-text-light'}`}
        >
          <BookOpen className="inline w-4 h-4 mr-1" /> 單元練習
        </button>
        <button
          onClick={() => canReviewWrong && switchMode('wrong-review')}
          disabled={!canReviewWrong}
          className={`px-3 py-1.5 rounded-full text-sm ${mode === 'wrong-review' ? 'bg-sky-light text-warm-text' : 'bg-white text-warm-text-light'} ${!canReviewWrong ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Target className="inline w-4 h-4 mr-1" /> 錯題回練（{wrongCount}）
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="bg-white rounded-lg p-2">題號：<b>{Math.min(questionNo, total)}/{total}</b></div>
        <div className="bg-white rounded-lg p-2">答對：<b>{correct}</b></div>
        <div className="bg-white rounded-lg p-2">答錯：<b>{wrong}</b></div>
        <div className="bg-white rounded-lg p-2">正確率：<b>{accuracy}%</b></div>
      </div>

      {!finished ? (
        <>
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-warm-text-light mb-2">{mode === 'wrong-review' ? '錯題回練模式' : '單元練習模式'}</p>
            <p className="text-2xl sm:text-3xl font-bold leading-relaxed">{problem.text}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => submitOption(opt)}
                disabled={locked}
                className="rounded-xl bg-white hover:bg-mint/40 border border-mint/30 py-4 text-xl font-bold transition-all disabled:opacity-80"
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowHint((v) => !v)} className="px-3 py-1.5 rounded-full bg-sky-light text-sm hover:bg-sky/50">
              {showHint ? '隱藏提示' : '看提示'}
            </button>
            <button onClick={() => resetRun()} className="px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">
              <RotateCcw className="inline w-4 h-4 mr-1" /> 重來
            </button>
          </div>

          {showHint && <p className="text-sm text-warm-text-light">💡 {problem.hint}</p>}

          {feedback === 'correct' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-emerald-100 text-emerald-800 p-2 text-sm">
              <CheckCircle2 className="inline w-4 h-4 mr-1" /> 答對了！
            </motion.div>
          )}
          {feedback === 'wrong' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-rose-100 text-rose-800 p-2 text-sm">
              <XCircle className="inline w-4 h-4 mr-1" /> 正確答案是 {problem.answer}
            </motion.div>
          )}
        </>
      ) : (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-mint p-5 text-center">
          <p className="text-2xl font-bold">🎉 挑戰完成！</p>
          <p className="mt-2">答對 {correct}/{total} 題，正確率 {Math.round((correct / total) * 100)}%</p>
          <p className="text-sm text-warm-text-light mt-1">總用時：{durationSec} 秒</p>
          <button onClick={() => resetRun()} className="mt-4 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-sm">
            再挑戰一次
          </button>
        </motion.div>
      )}
    </div>
  )
}
