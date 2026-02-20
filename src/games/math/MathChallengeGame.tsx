import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import type { Difficulty } from '../../types'

type Problem = {
  text: string
  answer: number
  hint: string
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateProblem(d: Difficulty): Problem {
  switch (d) {
    case 1: {
      const type = rand(1, 3)
      if (type === 1) {
        const a = rand(10, 99)
        const b = rand(1, 20)
        return { text: `${a} + ${b} = ?`, answer: a + b, hint: '先算十位，再算個位。' }
      }
      if (type === 2) {
        const a = rand(20, 99)
        const b = rand(1, Math.min(30, a - 1))
        return { text: `${a} - ${b} = ?`, answer: a - b, hint: '借位時先把十位減 1。' }
      }
      const n = rand(2, 9)
      return { text: `${n} + ${n} + ${n} = ?`, answer: n * 3, hint: '這是 3 倍的概念。' }
    }
    case 2: {
      const type = rand(1, 3)
      if (type === 1) {
        const a = rand(2, 12)
        const b = rand(2, 12)
        return { text: `${a} × ${b} = ?`, answer: a * b, hint: '先背乘法表。' }
      }
      if (type === 2) {
        const b = rand(2, 12)
        const ans = rand(2, 12)
        return { text: `${b * ans} ÷ ${b} = ?`, answer: ans, hint: '除法可反推乘法。' }
      }
      const a = rand(10, 50)
      const b = rand(2, 9)
      const c = rand(2, 9)
      return { text: `${a} + ${b} × ${c} = ?`, answer: a + b * c, hint: '先乘除後加減。' }
    }
    case 3: {
      const type = rand(1, 2)
      if (type === 1) {
        const a = rand(1, 9)
        const b = rand(1, 9)
        return { text: `0.${a} + 0.${b} = ?（小數一位）`, answer: Number((a / 10 + b / 10).toFixed(1)), hint: '小數點要對齊。' }
      }
      const n = rand(1, 8)
      return { text: `${n}/10 = ?（小數一位）`, answer: Number((n / 10).toFixed(1)), hint: '分母 10 直接看成小數一位。' }
    }
    case 4: {
      const x = rand(-9, 9)
      const a = rand(2, 9)
      const b = rand(-12, 12)
      const c = a * x + b
      return { text: `解 x：${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}`, answer: x, hint: '把常數移項，再除以係數。' }
    }
    case 5:
    default: {
      const r1 = rand(-6, 6) || 2
      const r2 = rand(-6, 6) || -3
      const b = -(r1 + r2)
      const c = r1 * r2
      return {
        text: `方程 x² ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = 0 的其中一個根是？`,
        answer: r1,
        hint: '可用因式分解 (x-r1)(x-r2)=0。',
      }
    }
  }
}

function buildOptions(answer: number, d: Difficulty): number[] {
  const deltaPool = d <= 2 ? [1, 2, 3, 5, 10] : d === 3 ? [0.1, 0.2, 0.3, 0.5, 1] : [1, 2, 3, 4, 5, 6]
  const options = new Set<number>([answer])

  while (options.size < 4) {
    const delta = deltaPool[rand(0, deltaPool.length - 1)]
    const sign = Math.random() < 0.5 ? -1 : 1
    const candidate = Number((answer + sign * delta).toFixed(1))
    if (candidate !== answer) options.add(candidate)
  }

  return Array.from(options).sort(() => Math.random() - 0.5)
}

export default function MathChallengeGame() {
  const difficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)

  const [problem, setProblem] = useState<Problem>(() => generateProblem(difficulty))
  const [options, setOptions] = useState<number[]>(() => buildOptions(problem.answer, difficulty))
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

  const gradeGuide = useMemo(() => {
    if (difficulty === 1) return '108課綱對齊：國小低年級（小二）→ 100 內加減與倍數概念'
    if (difficulty === 2) return '108課綱對齊：國小中年級 → 乘除與先乘除後加減'
    if (difficulty === 3) return '108課綱對齊：國小高年級 → 小數/分數基礎'
    if (difficulty === 4) return '國中程度 → 一元一次方程'
    return '高中程度 → 二次式基礎'
  }, [difficulty])

  const nextQuestion = (nextNo: number) => {
    const next = generateProblem(difficulty)
    setQuestionNo(nextNo)
    setProblem(next)
    setOptions(buildOptions(next.answer, difficulty))
    setFeedback(null)
    setShowHint(false)
    setLocked(false)
  }

  const resetGame = () => {
    const first = generateProblem(difficulty)
    setProblem(first)
    setOptions(buildOptions(first.answer, difficulty))
    setQuestionNo(1)
    setCorrect(0)
    setWrong(0)
    setStartAt(Date.now())
    setFeedback(null)
    setShowHint(false)
    setFinished(false)
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

    const nextNo = questionNo + 1
    if (nextNo > total) {
      const finalAcc = Math.round((nextCorrect / total) * 100)
      const finalScore = Math.max(100, Math.round(nextCorrect * 120 + finalAcc * 8 - durationSec))
      addScore({ gameType: 'math', difficulty, score: finalScore, durationSeconds: durationSec })
      setFinished(true)
      return
    }

    setTimeout(() => nextQuestion(nextNo), 700)
  }

  return (
    <div className="w-full max-w-3xl bg-white/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="rounded-xl bg-cream-light p-3 text-sm text-warm-text-light">{gradeGuide}</div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="bg-white rounded-lg p-2">題號：<b>{Math.min(questionNo, total)}/{total}</b></div>
        <div className="bg-white rounded-lg p-2">答對：<b>{correct}</b></div>
        <div className="bg-white rounded-lg p-2">答錯：<b>{wrong}</b></div>
        <div className="bg-white rounded-lg p-2">正確率：<b>{accuracy}%</b></div>
      </div>

      {!finished ? (
        <>
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-warm-text-light mb-2">請選擇正確答案</p>
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
            <button onClick={resetGame} className="px-3 py-1.5 rounded-full bg-cream text-sm hover:bg-cream/80">
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
          <button onClick={resetGame} className="mt-4 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-sm">
            再挑戰一次
          </button>
        </motion.div>
      )}
    </div>
  )
}
