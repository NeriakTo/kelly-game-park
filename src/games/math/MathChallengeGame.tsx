import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, RotateCcw, XCircle, BookOpen, Target } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'

type Grade = 1 | 2 | 3 | 4 | 5 | 6

type Unit = {
  id: string
  name: string
  description: string
  curriculumTag: string
}

type Problem = {
  text: string
  answer: number
  hint: string
  unitId: string
  curriculumTag: string
}

type UnitStat = {
  attempts: number
  correct: number
  lastAt?: string
}

const WRONG_BOOK_KEY = 'kelly-math-wrong-book-v2'
const UNIT_STATS_KEY = 'kelly-math-unit-stats-v1'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function gradeToDifficulty(grade: Grade): 1 | 2 | 3 {
  if (grade <= 2) return 1
  if (grade <= 4) return 2
  return 3
}

const GRADE_UNITS: Record<Grade, Unit[]> = {
  1: [
    { id: 'g1-add20', name: '20 內加法', description: '一年級：20 內加法與數感', curriculumTag: 'N-1-1' },
    { id: 'g1-sub20', name: '20 內減法', description: '一年級：20 內減法與補數概念', curriculumTag: 'N-1-2' },
    { id: 'g1-compare', name: '大小比較', description: '一年級：數字比較與序列', curriculumTag: 'N-1-3' },
  ],
  2: [
    { id: 'g2-add100', name: '100 內加法', description: '二年級：進位加法', curriculumTag: 'N-2-1' },
    { id: 'g2-sub100', name: '100 內減法', description: '二年級：退位減法', curriculumTag: 'N-2-2' },
    { id: 'g2-times', name: '乘法初階', description: '二年級：重複加法與倍數概念', curriculumTag: 'N-2-3' },
  ],
  3: [
    { id: 'g3-muldiv', name: '乘除法', description: '三年級：乘法表與除法反推', curriculumTag: 'N-3-1' },
    { id: 'g3-fraction', name: '分數入門', description: '三年級：同分母分數概念', curriculumTag: 'N-3-2' },
    { id: 'g3-mixed', name: '四則混合', description: '三年級：先乘除後加減', curriculumTag: 'N-3-3' },
  ],
  4: [
    { id: 'g4-muldiv-large', name: '大數乘除', description: '四年級：多位數乘除法', curriculumTag: 'N-4-1' },
    { id: 'g4-decimal', name: '小數運算', description: '四年級：小數加減', curriculumTag: 'N-4-2' },
    { id: 'g4-area', name: '周長面積', description: '四年級：長方形周長與面積', curriculumTag: 'S-4-1' },
  ],
  5: [
    { id: 'g5-fraction-op', name: '分數運算', description: '五年級：同分母分數加減', curriculumTag: 'N-5-1' },
    { id: 'g5-decimal-op', name: '小數四則', description: '五年級：小數乘除與估算', curriculumTag: 'N-5-2' },
    { id: 'g5-volume', name: '體積概念', description: '五年級：長方體體積', curriculumTag: 'S-5-1' },
  ],
  6: [
    { id: 'g6-ratio', name: '比與比值', description: '六年級：比例與比值', curriculumTag: 'N-6-1' },
    { id: 'g6-percent', name: '百分率', description: '六年級：折扣與百分率', curriculumTag: 'N-6-2' },
    { id: 'g6-algebra', name: '代數入門', description: '六年級：簡單未知數方程', curriculumTag: 'A-6-1' },
  ],
}

function getCurriculumTag(unitId: string): string {
  for (const g of [1, 2, 3, 4, 5, 6] as Grade[]) {
    const found = GRADE_UNITS[g].find((u) => u.id === unitId)
    if (found) return found.curriculumTag
  }
  return 'N-0-0'
}

function generateProblem(unitId: string): Problem {
  const curriculumTag = getCurriculumTag(unitId)
  switch (unitId) {
    case 'g1-add20': {
      const a = rand(1, 12)
      const b = rand(1, 20 - a)
      return { text: `${a} + ${b} = ?`, answer: a + b, hint: '先從大數開始數上去。', unitId, curriculumTag }
    }
    case 'g1-sub20': {
      const a = rand(6, 20)
      const b = rand(1, a - 1)
      return { text: `${a} - ${b} = ?`, answer: a - b, hint: '可以想成缺多少會回到被減數。', unitId, curriculumTag }
    }
    case 'g1-compare': {
      const a = rand(1, 30)
      const b = rand(1, 30)
      return { text: `${a} 和 ${b}，前者比較大嗎？（是=1，否=0）`, answer: a > b ? 1 : 0, hint: '先看十位，再看個位。', unitId, curriculumTag }
    }

    case 'g2-add100': {
      const a = rand(10, 99)
      const b = rand(1, 99 - a)
      return { text: `${a} + ${b} = ?`, answer: a + b, hint: '十位與個位分開算。', unitId, curriculumTag }
    }
    case 'g2-sub100': {
      const a = rand(20, 99)
      const b = rand(1, a - 1)
      return { text: `${a} - ${b} = ?`, answer: a - b, hint: '需要時先借位。', unitId, curriculumTag }
    }
    case 'g2-times': {
      const n = rand(2, 9)
      const t = rand(2, 5)
      return { text: `${n} + ${n}${t >= 3 ? ` + ${n}` : ''}${t >= 4 ? ` + ${n}` : ''}${t >= 5 ? ` + ${n}` : ''} = ?`, answer: n * t, hint: '這是 n 的 t 倍。', unitId, curriculumTag }
    }

    case 'g3-muldiv': {
      if (Math.random() < 0.5) {
        const a = rand(2, 12)
        const b = rand(2, 12)
        return { text: `${a} × ${b} = ?`, answer: a * b, hint: '先想乘法表。', unitId, curriculumTag }
      }
      const b = rand(2, 12)
      const ans = rand(2, 12)
      return { text: `${b * ans} ÷ ${b} = ?`, answer: ans, hint: '除法可用乘法回推。', unitId, curriculumTag }
    }
    case 'g3-fraction': {
      const a = rand(1, 8)
      const b = rand(1, 8)
      return { text: `${a}/10 + ${b}/10 = ?（小數一位）`, answer: Number(((a + b) / 10).toFixed(1)), hint: '同分母先加分子。', unitId, curriculumTag }
    }
    case 'g3-mixed': {
      const a = rand(10, 60)
      const b = rand(2, 9)
      const c = rand(2, 9)
      return { text: `${a} + ${b} × ${c} = ?`, answer: a + b * c, hint: '先乘再加。', unitId, curriculumTag }
    }

    case 'g4-muldiv-large': {
      const a = rand(12, 99)
      const b = rand(2, 9)
      return { text: `${a} × ${b} = ?`, answer: a * b, hint: '把十位與個位拆開算。', unitId, curriculumTag }
    }
    case 'g4-decimal': {
      const a = rand(1, 19) / 10
      const b = rand(1, 19) / 10
      return { text: `${a.toFixed(1)} + ${b.toFixed(1)} = ?`, answer: Number((a + b).toFixed(1)), hint: '小數點對齊。', unitId, curriculumTag }
    }
    case 'g4-area': {
      const l = rand(3, 15)
      const w = rand(2, 12)
      return { text: `長方形長 ${l}、寬 ${w}，面積 = ?`, answer: l * w, hint: '面積 = 長 × 寬。', unitId, curriculumTag }
    }

    case 'g5-fraction-op': {
      const den = rand(4, 10)
      const a = rand(1, den - 1)
      const b = rand(1, den - a)
      return { text: `${a}/${den} + ${b}/${den} = ?（小數一位）`, answer: Number(((a + b) / den).toFixed(1)), hint: '同分母加法。', unitId, curriculumTag }
    }
    case 'g5-decimal-op': {
      const a = rand(12, 80) / 10
      const b = rand(2, 9)
      return { text: `${a.toFixed(1)} × ${b} = ?（小數一位）`, answer: Number((a * b).toFixed(1)), hint: '先當整數乘，再補小數點。', unitId, curriculumTag }
    }
    case 'g5-volume': {
      const l = rand(2, 10)
      const w = rand(2, 10)
      const h = rand(2, 10)
      return { text: `長方體 ${l}×${w}×${h}，體積 = ?`, answer: l * w * h, hint: '體積 = 長 × 寬 × 高。', unitId, curriculumTag }
    }

    case 'g6-ratio': {
      const a = rand(2, 9)
      const b = rand(2, 9)
      const k = rand(2, 5)
      return { text: `比 ${a}:${b}，若前項是 ${a * k}，後項是 ?`, answer: b * k, hint: '同倍放大。', unitId, curriculumTag }
    }
    case 'g6-percent': {
      const base = rand(100, 500)
      const p = rand(10, 50)
      return { text: `${base} 的 ${p}% 是 ?`, answer: Number((base * p / 100).toFixed(1)), hint: '先乘再除 100。', unitId, curriculumTag }
    }
    case 'g6-algebra':
    default: {
      const x = rand(2, 20)
      const a = rand(2, 9)
      const b = rand(1, 20)
      return { text: `解 x：${a}x + ${b} = ${a * x + b}`, answer: x, hint: '先移項再除係數。', unitId, curriculumTag }
    }
  }
}

function buildOptions(answer: number, grade: Grade): number[] {
  const deltaPool = grade <= 2
    ? [1, 2, 3, 5, 10]
    : grade <= 4
      ? [1, 2, 3, 4, 6, 8]
      : [0.1, 0.2, 0.3, 0.5, 1, 2, 5]

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

function loadUnitStats(): Record<string, UnitStat> {
  try {
    const raw = localStorage.getItem(UNIT_STATS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveUnitStats(stats: Record<string, UnitStat>) {
  try {
    localStorage.setItem(UNIT_STATS_KEY, JSON.stringify(stats))
  } catch {}
}

export default function MathChallengeGame() {
  const addScore = useGameStore((s) => s.addScore)

  const [grade, setGrade] = useState<Grade>(2)
  const [units, setUnits] = useState<Unit[]>(() => GRADE_UNITS[2])
  const [selectedUnitId, setSelectedUnitId] = useState<string>(GRADE_UNITS[2][0].id)
  const [mode, setMode] = useState<'normal' | 'wrong-review'>('normal')

  const [wrongBook, setWrongBook] = useState<Record<string, Problem[]>>(() => loadWrongBook())
  const [unitStats, setUnitStats] = useState<Record<string, UnitStat>>(() => loadUnitStats())

  const buildNextProblem = (unitId: string, nextMode: 'normal' | 'wrong-review'): Problem => {
    const key = `${grade}-${unitId}`
    if (nextMode === 'wrong-review') {
      const bucket = wrongBook[key] ?? []
      if (bucket.length > 0) return bucket[rand(0, bucket.length - 1)]
    }
    return generateProblem(unitId)
  }

  const [problem, setProblem] = useState<Problem>(() => buildNextProblem(selectedUnitId, 'normal'))
  const [options, setOptions] = useState<number[]>(() => buildOptions(problem.answer, grade))

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

  const wrongKey = `${grade}-${selectedUnitId}`
  const wrongCount = (wrongBook[wrongKey] ?? []).length

  const gradeGuide = useMemo(() => {
    return `108課綱國小 ${grade} 年級數學：${units.map((u) => u.name).join('、')}`
  }, [grade, units])

  const resetRun = (unitId: string = selectedUnitId, nextMode: 'normal' | 'wrong-review' = mode) => {
    const first = buildNextProblem(unitId, nextMode)
    setProblem(first)
    setOptions(buildOptions(first.answer, grade))
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
    const key = `${grade}-${p.unitId}`
    const prev = wrongBook[key] ?? []
    const exists = prev.some((x) => x.text === p.text && x.answer === p.answer)
    const nextBook = { ...wrongBook, [key]: exists ? prev : [...prev, p].slice(-40) }
    setWrongBook(nextBook)
    saveWrongBook(nextBook)
  }

  const removeWrongProblem = (p: Problem) => {
    const key = `${grade}-${p.unitId}`
    const prev = wrongBook[key] ?? []
    const next = prev.filter((x) => !(x.text === p.text && x.answer === p.answer))
    const nextBook = { ...wrongBook, [key]: next }
    setWrongBook(nextBook)
    saveWrongBook(nextBook)
  }

  const recordUnitAttempt = (unitId: string, isCorrect: boolean) => {
    const key = `${grade}-${unitId}`
    const prev = unitStats[key] ?? { attempts: 0, correct: 0 }
    const next: UnitStat = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      lastAt: new Date().toISOString(),
    }
    const nextStats = { ...unitStats, [key]: next }
    setUnitStats(nextStats)
    saveUnitStats(nextStats)
  }

  const nextQuestion = (nextNo: number) => {
    const next = buildNextProblem(selectedUnitId, mode)
    setQuestionNo(nextNo)
    setProblem(next)
    setOptions(buildOptions(next.answer, grade))
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
    recordUnitAttempt(problem.unitId, ok)

    if (!ok) addWrongProblem(problem)
    if (ok && mode === 'wrong-review') removeWrongProblem(problem)

    const nextNo = questionNo + 1
    if (nextNo > total) {
      const finalAcc = Math.round((nextCorrect / total) * 100)
      const finalScore = Math.max(100, Math.round(nextCorrect * 120 + finalAcc * 8 - durationSec))
      addScore({ gameType: 'math', difficulty: gradeToDifficulty(grade), score: finalScore, durationSeconds: durationSec })
      setFinished(true)
      return
    }

    setTimeout(() => nextQuestion(nextNo), 700)
  }

  const onChangeGrade = (g: Grade) => {
    const nextUnits = GRADE_UNITS[g]
    const firstUnit = nextUnits[0].id
    setGrade(g)
    setUnits(nextUnits)
    setSelectedUnitId(firstUnit)
    setMode('normal')

    const first = generateProblem(firstUnit)
    setProblem(first)
    setOptions(buildOptions(first.answer, g))
    setQuestionNo(1)
    setCorrect(0)
    setWrong(0)
    setStartAt(Date.now())
    setFeedback(null)
    setShowHint(false)
    setFinished(false)
    setLocked(false)
  }

  const onSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId)
    setMode('normal')
    resetRun(unitId, 'normal')
  }

  const switchMode = (nextMode: 'normal' | 'wrong-review') => {
    setMode(nextMode)
    resetRun(selectedUnitId, nextMode)
  }

  const canReviewWrong = wrongCount > 0

  const unitMap = units.map((u) => {
    const key = `${grade}-${u.id}`
    const stat = unitStats[key] ?? { attempts: 0, correct: 0 }
    const acc = stat.attempts === 0 ? 0 : Math.round((stat.correct / stat.attempts) * 100)
    const wrongs = (wrongBook[key] ?? []).length
    const status = stat.attempts === 0 ? '未開始' : acc >= 85 ? '已熟練' : acc >= 65 ? '練習中' : '待加強'
    return { ...u, stat, acc, wrongs, status }
  })

  return (
    <div className="w-full max-w-4xl bg-white/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="rounded-xl bg-cream-light p-3 text-sm text-warm-text-light">{gradeGuide}</div>

      <div className="flex flex-wrap gap-2">
        {([1, 2, 3, 4, 5, 6] as Grade[]).map((g) => (
          <button
            key={g}
            onClick={() => onChangeGrade(g)}
            className={`px-3 py-1.5 rounded-full text-sm ${grade === g ? 'bg-mint text-warm-text' : 'bg-white text-warm-text-light'}`}
          >
            {g} 年級
          </button>
        ))}
      </div>

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

      <div className="rounded-xl bg-white/80 p-3">
        <p className="text-sm font-semibold mb-2">📍 學習地圖（{grade} 年級）</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {unitMap.map((u) => (
            <div key={u.id} className={`rounded-lg border p-2 ${selectedUnitId === u.id ? 'border-mint bg-mint/20' : 'border-mint/20 bg-white'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{u.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-cream-light">{u.status}</span>
              </div>
              <div className="text-warm-text-light mt-1">課綱標籤：{u.curriculumTag}</div>
              <div className="mt-1">作答 {u.stat.attempts} 次｜正確率 {u.acc}%</div>
              <div>錯題 {u.wrongs} 題</div>
            </div>
          ))}
        </div>
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
            <p className="text-sm text-warm-text-light mb-2">{mode === 'wrong-review' ? '錯題回練模式' : '單元練習模式'}｜課綱：{problem.curriculumTag}</p>
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
