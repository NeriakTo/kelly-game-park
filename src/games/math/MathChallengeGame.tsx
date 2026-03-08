import { useMemo, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, RotateCcw, XCircle, BookOpen, Target } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import type { Grade, Unit, Problem } from './generators'
import { GRADE_UNITS, generateProblem, buildOptions, gradeToDifficulty } from './generators'
import { generateMathProblemWithAI } from '../../services/ai'

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
  const aiConfig = useGameStore((s) => s.aiConfig)

  const [grade, setGrade] = useState<Grade>(2)
  const [units, setUnits] = useState<readonly Unit[]>(() => GRADE_UNITS[2])
  const [selectedUnitId, setSelectedUnitId] = useState<string>(GRADE_UNITS[2][0].id)
  const [mode, setMode] = useState<'normal' | 'wrong-review'>('normal')

  const [wrongBook, setWrongBook] = useState<Record<string, Problem[]>>(() => loadWrongBook())
  const [unitStats, setUnitStats] = useState<Record<string, UnitStat>>(() => loadUnitStats())

  // 自適應難度：連續答錯 2 題後自動降低題目難度
  const consecutiveWrongRef = useRef(0)
  const easyMode = consecutiveWrongRef.current >= 2

  const buildNextProblem = (unitId: string, nextMode: 'normal' | 'wrong-review', easy: boolean = easyMode): Problem => {
    const key = `${grade}-${unitId}`
    if (nextMode === 'wrong-review') {
      const bucket = wrongBook[key] ?? []
      if (bucket.length > 0) return bucket[rand(0, bucket.length - 1)]
    }
    return generateProblem(unitId, easy)
  }

  const [problem, setProblem] = useState<Problem>(() => buildNextProblem(selectedUnitId, 'normal', false))
  const [options, setOptions] = useState<number[]>(() => buildOptions(problem.answer, grade))
  const [problemSource, setProblemSource] = useState<'local' | 'ai'>('local')
  const [aiFallbackReason, setAiFallbackReason] = useState<string | null>(null)

  const [questionNo, setQuestionNo] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [startAt, setStartAt] = useState(Date.now())
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [finished, setFinished] = useState(false)
  const [locked, setLocked] = useState(false)
  const [easyNotice, setEasyNotice] = useState(false)

  const total = 10
  const answered = correct + wrong
  const accuracy = answered === 0 ? 100 : Math.round((correct / answered) * 100)
  const durationSec = Math.max(1, Math.floor((Date.now() - startAt) / 1000))

  const wrongKey = `${grade}-${selectedUnitId}`
  const wrongCount = (wrongBook[wrongKey] ?? []).length

  const gradeGuide = useMemo(() => {
    return `108課綱國小 ${grade} 年級數學：${units.map((u) => u.name).join('、')}`
  }, [grade, units])

  const mapAIReasonLabel = (reason: string | null): string => {
    switch (reason) {
      case 'provider_auth_error':
      case 'provider_permission_denied':
        return '（AI Key 權限或限制設定問題，自動回退）'
      case 'provider_rate_limited':
        return '（AI 配額或速率限制，自動回退）'
      case 'provider_network_or_cors':
        return '（AI 連線被瀏覽器或網域限制，自動回退）'
      case 'provider_timeout':
        return '（AI 回應逾時，自動回退）'
      case 'invalid_schema':
        return '（AI 回傳格式異常，自動回退）'
      case 'provider_bad_request':
        return '（AI 請求參數異常，自動回退）'
      default:
        return '（AI 暫不可用，自動回退）'
    }
  }

  const buildNextProblemWithAI = useCallback(async (
    unitId: string,
    nextMode: 'normal' | 'wrong-review',
    easy: boolean,
  ): Promise<Problem> => {
    const fallback = () => buildNextProblem(unitId, nextMode, easy)
    if (!aiConfig || nextMode === 'wrong-review') {
      setProblemSource('local')
      setAiFallbackReason(null)
      return fallback()
    }

    const result = await generateMathProblemWithAI(
      aiConfig,
      {
        gradeBand: `grade-${grade}`,
        unitId,
        difficulty: gradeToDifficulty(grade),
      },
      fallback,
    )
    setProblemSource(result.source)
    setAiFallbackReason(result.source === 'local' ? result.reason : null)
    return result.data
  }, [aiConfig, grade, buildNextProblem])

  const resetRun = (unitId: string = selectedUnitId, nextMode: 'normal' | 'wrong-review' = mode) => {
    consecutiveWrongRef.current = 0
    setEasyNotice(false)
    const first = buildNextProblem(unitId, nextMode, false)
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

    void (async () => {
      const aiFirst = await buildNextProblemWithAI(unitId, nextMode, false)
      setProblem(aiFirst)
      setOptions(buildOptions(aiFirst.answer, grade))
    })()
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

  const nextQuestion = async (nextNo: number) => {
    const isEasy = consecutiveWrongRef.current >= 2
    setEasyNotice(isEasy)

    const localNext = buildNextProblem(selectedUnitId, mode, isEasy)
    setQuestionNo(nextNo)
    setProblem(localNext)
    setOptions(buildOptions(localNext.answer, grade))
    setFeedback(null)
    setShowHint(false)
    setLocked(false)

    const aiNext = await buildNextProblemWithAI(selectedUnitId, mode, isEasy)
    setProblem(aiNext)
    setOptions(buildOptions(aiNext.answer, grade))
  }

  const submitOption = (choice: number) => {
    if (finished || locked) return
    setLocked(true)

    const ok = Math.abs(choice - problem.answer) < 0.0001
    setFeedback(ok ? 'correct' : 'wrong')

    // 自適應難度追蹤
    if (ok) {
      consecutiveWrongRef.current = 0
      setEasyNotice(false)
    } else {
      consecutiveWrongRef.current += 1
    }

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

    setTimeout(() => { void nextQuestion(nextNo) }, 700)
  }

  const onChangeGrade = (g: Grade) => {
    const nextUnits = GRADE_UNITS[g]
    const firstUnit = nextUnits[0].id
    setGrade(g)
    setUnits(nextUnits)
    setSelectedUnitId(firstUnit)
    setMode('normal')
    consecutiveWrongRef.current = 0
    setEasyNotice(false)

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
          {/* 自適應難度提示 */}
          {easyNotice && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-sm text-amber-700 text-center">
              沒關係！先從簡單一點的題目練習吧 💪
            </div>
          )}

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-warm-text-light mb-2">
              {mode === 'wrong-review' ? '錯題回練模式' : '單元練習模式'}｜課綱：{problem.curriculumTag}｜來源：
              {problemSource === 'ai'
                ? 'AI'
                : aiConfig
                  ? `本地題庫${mapAIReasonLabel(aiFallbackReason)}`
                  : '本地題庫'}
            </p>
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
