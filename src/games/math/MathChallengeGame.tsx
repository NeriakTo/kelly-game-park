import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, RotateCcw, XCircle, BookOpen, Target } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGameLevel } from '../../components/GameShell/session'
import { MATH_LEVEL_EASING } from '../../data/levelMap'
import type { Grade, Problem } from './generators'
import { GRADE_UNITS, generateProblem, buildOptions, gradeToDifficulty } from './generators'
import { generateMathProblemWithAI } from '../../services/ai'
import { type UnitStat, loadWrongBook, saveWrongBook, loadUnitStats, saveUnitStats } from './records'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function MathChallengeGame() {
  const addScore = useGameStore((s) => s.addScore)
  const aiConfig = useGameStore((s) => s.aiConfig)
  const aiMode = useGameStore((s) => s.aiModes.math)
  // 年級由家長區設定；AI 出題開關也在家長區（孩子畫面上不再有這兩個控制）
  const settingsGrade = useSettingsStore((s) => s.grade)
  const easing = MATH_LEVEL_EASING[useGameLevel()]

  const [grade, setGrade] = useState<Grade>(settingsGrade)
  const units = GRADE_UNITS[grade]
  const [selectedUnitId, setSelectedUnitId] = useState<string>(GRADE_UNITS[settingsGrade][0].id)
  const [mode, setMode] = useState<'normal' | 'wrong-review'>('normal')

  const [wrongBook, setWrongBook] = useState<Record<string, Problem[]>>(() => loadWrongBook())
  const [unitStats, setUnitStats] = useState<Record<string, UnitStat>>(() => loadUnitStats())

  // 簡單題的用法看選的關卡：簡單＝一律簡單題；普通＝連續答錯 2 題後自動改出簡單題；挑戰＝一律正常題
  const consecutiveWrongRef = useRef(0)
  const easyFor = (wrongStreak: number): boolean =>
    easing === 'always' ? true : easing === 'never' ? false : wrongStreak >= 2
  const easyMode = easyFor(consecutiveWrongRef.current)

  // forGrade：切年級時 state 還沒更新，要由呼叫端明確帶入新年級
  const buildNextProblem = (
    unitId: string,
    nextMode: 'normal' | 'wrong-review',
    easy: boolean = easyMode,
    forGrade: Grade = grade,
  ): Problem => {
    const key = `${forGrade}-${unitId}`
    if (nextMode === 'wrong-review') {
      const bucket = wrongBook[key] ?? []
      if (bucket.length > 0) return bucket[rand(0, bucket.length - 1)]
    }
    return generateProblem(unitId, easy)
  }

  const [problem, setProblem] = useState<Problem>(() => buildNextProblem(selectedUnitId, 'normal', easyFor(0)))
  const [options, setOptions] = useState<number[]>(() => buildOptions(problem.answer, grade))

  const [questionNo, setQuestionNo] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [startAt, setStartAt] = useState(Date.now())
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [finished, setFinished] = useState(false)
  const [locked, setLocked] = useState(false)
  const [easyNotice, setEasyNotice] = useState(false)

  const prefetchedRef = useRef<{
    unitId: string
    mode: 'normal' | 'wrong-review'
    easy: boolean
    problem: Problem
    source: 'local' | 'ai'
    reason: string | null
  } | null>(null)
  const prefetchSeqRef = useRef(0)
  // 每次重開一回合就加一；答題後排定的下一題會比對它，避免舊回合蓋掉新題目
  const runIdRef = useRef(0)

  const total = 10
  const answered = correct + wrong
  const accuracy = answered === 0 ? 100 : Math.round((correct / answered) * 100)
  const durationSec = Math.max(1, Math.floor((Date.now() - startAt) / 1000))

  const wrongKey = `${grade}-${selectedUnitId}`
  const wrongCount = (wrongBook[wrongKey] ?? []).length

  const buildNextProblemWithAI = useCallback(async (
    unitId: string,
    nextMode: 'normal' | 'wrong-review',
    easy: boolean,
    forGrade: Grade,
  ): Promise<{ problem: Problem; source: 'local' | 'ai'; reason: string | null }> => {
    const fallback = () => buildNextProblem(unitId, nextMode, easy, forGrade)
    if (aiMode !== 'ai' || !aiConfig || nextMode === 'wrong-review') {
      return { problem: fallback(), source: 'local', reason: null }
    }

    const result = await generateMathProblemWithAI(
      aiConfig,
      {
        gradeBand: `grade-${forGrade}`,
        unitId,
        difficulty: gradeToDifficulty(forGrade),
      },
      fallback,
    )

    return {
      problem: result.data,
      source: result.source,
      reason: result.source === 'local' ? result.reason : null,
    }
  }, [aiMode, aiConfig, buildNextProblem])

  const prefetchUpcoming = useCallback((
    unitId: string,
    nextMode: 'normal' | 'wrong-review',
    easy: boolean,
    forGrade: Grade,
  ) => {
    const seq = ++prefetchSeqRef.current
    void (async () => {
      const next = await buildNextProblemWithAI(unitId, nextMode, easy, forGrade)
      if (seq !== prefetchSeqRef.current) return
      prefetchedRef.current = {
        unitId,
        mode: nextMode,
        easy,
        problem: next.problem,
        source: next.source,
        reason: next.reason,
      }
    })()
  }, [buildNextProblemWithAI])

  const resetRun = (
    unitId: string = selectedUnitId,
    nextMode: 'normal' | 'wrong-review' = mode,
    forGrade: Grade = grade,
  ) => {
    // 新的一回合：讓上一回合答題後排定的「下一題」失效
    runIdRef.current += 1
    consecutiveWrongRef.current = 0
    setEasyNotice(false)
    prefetchedRef.current = null
    prefetchSeqRef.current += 1

    const first = buildNextProblem(unitId, nextMode, easyFor(0), forGrade)
    setProblem(first)
    setOptions(buildOptions(first.answer, forGrade))
    setQuestionNo(1)
    setCorrect(0)
    setWrong(0)
    setStartAt(Date.now())
    setFeedback(null)
    setShowHint(false)
    setFinished(false)
    setLocked(false)

    prefetchUpcoming(unitId, nextMode, easyFor(0), forGrade)
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
    const isEasy = easyFor(consecutiveWrongRef.current)
    // 「先從簡單一點的題目練習」只在普通關自動降級時提示；簡單關本來就是簡單題，不必提示
    setEasyNotice(isEasy && easing === 'after-two-wrong')

    const cached = prefetchedRef.current
    const canUseCached = Boolean(
      cached &&
      cached.unitId === selectedUnitId &&
      cached.mode === mode &&
      cached.easy === isEasy,
    )

    const nextProblem = canUseCached
      ? (cached as NonNullable<typeof cached>).problem
      : buildNextProblem(selectedUnitId, mode, isEasy)

    setQuestionNo(nextNo)
    setProblem(nextProblem)
    setOptions(buildOptions(nextProblem.answer, grade))
    setFeedback(null)
    setShowHint(false)
    setLocked(false)

    prefetchedRef.current = null
    prefetchUpcoming(selectedUnitId, mode, isEasy, grade)
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

    const runId = runIdRef.current
    setTimeout(() => {
      // 等待期間若已切年級、換單元或重來，這一題就不再換上來
      if (runId !== runIdRef.current) return
      void nextQuestion(nextNo)
    }, 700)
  }

  const onChangeGrade = (g: Grade) => {
    const firstUnit = GRADE_UNITS[g][0].id
    setGrade(g)
    setSelectedUnitId(firstUnit)
    setMode('normal')
    // 立即換成新年級第一個單元的題目，並重設計數
    resetRun(firstUnit, 'normal', g)
  }

  // 家長區改了年級：立即換成新年級第一個單元的題目
  useEffect(() => {
    if (settingsGrade !== grade) onChangeGrade(settingsGrade)
    // 只在設定的年級改變時執行
  }, [settingsGrade])

  // 一進來就先預備下一題（開了 AI 出題時，第 2 題就能用 AI 的題目）
  useEffect(() => {
    prefetchUpcoming(selectedUnitId, mode, easyFor(0), grade)
    // 只在第一次掛上時執行
  }, [])

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

  return (
    <div className="w-full max-w-4xl bg-white/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
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
          {/* 自適應難度提示 */}
          {easyNotice && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-sm text-amber-700 text-center">
              沒關係！先從簡單一點的題目練習吧 💪
            </div>
          )}

          {/* 課綱代碼不給小孩看（在家長區的學習紀錄）；data 屬性留給測試確認題目屬於哪個單元 */}
          <div
            className="rounded-2xl bg-white p-6 text-center shadow-sm"
            data-testid="math-problem"
            data-curriculum-tag={problem.curriculumTag}
          >
            <p className="text-sm text-warm-text-light mb-2">
              {mode === 'wrong-review' ? '錯題回練' : '單元練習'}
            </p>
            <p data-problem-text className="text-2xl sm:text-3xl font-bold leading-relaxed">{problem.text}</p>
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
