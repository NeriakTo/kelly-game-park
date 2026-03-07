import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import type { StageId, CoinValue, ShopQuestion, DinoCollectionData, DinoFossil } from './types'
import {
  COLLECTION_STORAGE_KEY,
  DINO_COLLECTION,
  PIECES_PER_DINO,
  CORRECT_PER_PIECE,
} from './types'
import { generateQuestion, calculateScore } from './data'
import Shopkeeper from './Shopkeeper'
import ShopDisplay from './ShopDisplay'
import CoinPanel from './CoinPanel'
import StageSelector from './StageSelector'
import DinoCollection from './DinoCollection'

const QUESTIONS_PER_ROUND = 8

function loadCollection(): DinoCollectionData {
  try {
    const raw = localStorage.getItem(COLLECTION_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    fossils: DINO_COLLECTION.map((d) => ({
      dinoId: d.id,
      dinoName: d.name,
      dinoEmoji: d.emoji,
      totalPieces: PIECES_PER_DINO,
      collectedPieces: 0,
    })),
    totalCorrect: 0,
    stageProgress: {},
  }
}

function saveCollection(data: DinoCollectionData): void {
  try {
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function addFossilPiece(data: DinoCollectionData): DinoCollectionData {
  // 找到第一個未完成的恐龍，加一片碎片
  const fossils = data.fossils.map((f) => ({ ...f }))
  const incomplete = fossils.find((f) => f.collectedPieces < f.totalPieces)
  if (incomplete) {
    return {
      ...data,
      fossils: fossils.map((f) =>
        f.dinoId === incomplete.dinoId
          ? { ...f, collectedPieces: f.collectedPieces + 1 }
          : f,
      ) as DinoFossil[],
    }
  }
  return data
}

type GamePhase = 'playing' | 'feedback' | 'result'
type FeedbackType = 'correct' | 'wrong'

export default function DinoShopGame() {
  const difficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)

  const [stage, setStage] = useState<StageId>('A')
  const [question, setQuestion] = useState<ShopQuestion>(() => generateQuestion('A', difficulty))
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [feedback, setFeedback] = useState<FeedbackType>('correct')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [paidCoins, setPaidCoins] = useState<CoinValue[]>([])
  const [collection, setCollection] = useState<DinoCollectionData>(loadCollection)
  const [showCollection, setShowCollection] = useState(false)
  const [message, setMessage] = useState('歡迎來到達克比的恐龍商店！')
  const [mood, setMood] = useState<'idle' | 'thinking' | 'happy' | 'hint'>('idle')

  const startTimeRef = useRef(Date.now())
  const correctStreakRef = useRef(0)
  const consecutiveWrongRef = useRef(0)
  const [easyNotice, setEasyNotice] = useState(false)

  // 難度或關卡改變時重新開始
  useEffect(() => {
    resetGame()
  }, [difficulty, stage])

  const resetGame = useCallback(() => {
    consecutiveWrongRef.current = 0
    setEasyNotice(false)
    const q = generateQuestion(stage, difficulty, false)
    setQuestion(q)
    setQuestionIndex(0)
    setCorrect(0)
    setPhase('playing')
    setSelectedOption(null)
    setPaidCoins([])
    setMessage(q.description)
    setMood('idle')
    startTimeRef.current = Date.now()
    correctStreakRef.current = 0
  }, [stage, difficulty])

  const nextQuestion = useCallback(() => {
    if (questionIndex + 1 >= QUESTIONS_PER_ROUND) {
      // 結算
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
      const score = calculateScore(correct, QUESTIONS_PER_ROUND, duration)
      addScore({
        gameType: 'dino-shop',
        difficulty,
        score,
        durationSeconds: duration,
      })
      setPhase('result')
      setMessage(`太棒了！你答對了 ${correct}/${QUESTIONS_PER_ROUND} 題！`)
      setMood('happy')
      return
    }

    const isEasy = consecutiveWrongRef.current >= 2
    setEasyNotice(isEasy)
    const q = generateQuestion(stage, difficulty, isEasy)
    setQuestion(q)
    setQuestionIndex((prev) => prev + 1)
    setPhase('playing')
    setSelectedOption(null)
    setPaidCoins([])
    setMessage(q.description)
    setMood('idle')
  }, [questionIndex, stage, difficulty, correct, addScore])

  const handleAnswer = useCallback(
    (answer: number) => {
      const isCorrect = answer === question.answer
      if (isCorrect) {
        setCorrect((prev) => prev + 1)
        correctStreakRef.current += 1
        consecutiveWrongRef.current = 0
        setEasyNotice(false)
        setFeedback('correct')
        setMessage('答對了！好厲害！🎉')
        setMood('happy')

        // 化石碎片獎勵
        let updated = { ...collection, totalCorrect: collection.totalCorrect + 1 }
        if (correctStreakRef.current % CORRECT_PER_PIECE === 0) {
          updated = addFossilPiece(updated)
          setMessage('答對了！還獲得了一片化石碎片！🦴')
        }
        setCollection(updated)
        saveCollection(updated)
      } else {
        correctStreakRef.current = 0
        consecutiveWrongRef.current += 1
        setFeedback('wrong')
        const answerLabel = isBinaryBudgetCheck
          ? (question.answer === 1 ? '夠' : '不夠')
          : `${question.answer} 元`
        setMessage(`答案是「${answerLabel}」喔，沒關係，下次會更好！`)
        setMood('hint')
      }
      setPhase('feedback')
    },
    [question, collection],
  )

  const handleOptionSelect = useCallback(
    (value: number) => {
      if (phase !== 'playing') return
      setSelectedOption(value)
      handleAnswer(value)
    },
    [phase, handleAnswer],
  )

  const handleCoinConfirm = useCallback(() => {
    const total = paidCoins.reduce((sum, v) => sum + v, 0)
    handleAnswer(total)
  }, [paidCoins, handleAnswer])

  const isBinaryBudgetCheck =
    question.type === 'budget-check' &&
    !!question.options &&
    question.options.length === 2 &&
    question.options.includes(0) &&
    question.options.includes(1)

  const isItemSelectBudgetCheck = question.type === 'budget-check' && !isBinaryBudgetCheck

  const handleAddCoin = useCallback((value: CoinValue) => {
    setPaidCoins((prev) => [...prev, value])
  }, [])

  const handleRemoveCoin = useCallback((index: number) => {
    setPaidCoins((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const showHint = useCallback(() => {
    setMessage(`${question.description}（提示：${question.hint}）`)
    setMood('hint')
  }, [question])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* 進度條 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-fossil-light/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-fossil"
            animate={{ width: `${((questionIndex + (phase === 'feedback' ? 1 : 0)) / QUESTIONS_PER_ROUND) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs text-warm-text-light shrink-0">
          {questionIndex + 1}/{QUESTIONS_PER_ROUND}
        </span>
      </div>

      {/* 店長對話 */}
      <Shopkeeper message={message} mood={mood} />

      {/* 結算畫面 */}
      {phase === 'result' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 rounded-2xl p-6 text-center space-y-4"
        >
          <div className="text-4xl">🎊</div>
          <h3 className="text-xl font-bold text-warm-text">
            答對 {correct}/{QUESTIONS_PER_ROUND} 題
          </h3>
          <p className="text-sm text-warm-text-light">
            正確率 {Math.round((correct / QUESTIONS_PER_ROUND) * 100)}%
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetGame}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fossil text-white font-medium hover:bg-fossil/90 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              再玩一次
            </button>
            <button
              onClick={() => setShowCollection(true)}
              className="px-4 py-2 rounded-xl bg-cream text-warm-text font-medium hover:bg-cream/80 transition-colors"
            >
              🏆 查看收藏
            </button>
          </div>
        </motion.div>
      )}

      {/* 遊戲中 / 回饋 */}
      {phase !== 'result' && (
        <>
          {/* 自適應難度提示 */}
          {easyNotice && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-sm text-amber-700 text-center">
              沒關係！先從簡單一點的題目練習吧 💪
            </div>
          )}

          {/* 商品展示 */}
          {question.items.length > 0 && (
            <ShopDisplay
              items={question.items}
              selectable={isItemSelectBudgetCheck && phase === 'playing'}
              onSelect={(item) => handleOptionSelect(item.price)}
            />
          )}

          {/* 硬幣付款模式 */}
          {question.coinPayment && phase === 'playing' && (
            <CoinPanel
              paidCoins={paidCoins}
              onAddCoin={handleAddCoin}
              onRemoveCoin={handleRemoveCoin}
              onConfirm={handleCoinConfirm}
              onClear={() => setPaidCoins([])}
              targetAmount={question.targetAmount}
            />
          )}

          {/* 選擇題模式 */}
          {question.options && !question.coinPayment && (question.type !== 'budget-check' || isBinaryBudgetCheck) && (
            <div className="grid grid-cols-2 gap-2 p-2">
              {question.options.map((opt) => {
                let btnClass = 'bg-white/70 border-fossil-light/40 text-warm-text hover:border-fossil'
                if (phase === 'feedback') {
                  if (opt === question.answer) {
                    btnClass = 'bg-green-100 border-green-400 text-green-800'
                  } else if (opt === selectedOption && feedback === 'wrong') {
                    btnClass = 'bg-red-100 border-red-400 text-red-800'
                  } else {
                    btnClass = 'bg-white/40 border-gray-200 text-gray-400'
                  }
                }
                const label = isBinaryBudgetCheck
                  ? (opt === 1 ? '夠' : '不夠')
                  : `${opt} 元`
                return (
                  <motion.button
                    key={opt}
                    whileTap={phase === 'playing' ? { scale: 0.95 } : undefined}
                    onClick={() => handleOptionSelect(opt)}
                    disabled={phase !== 'playing'}
                    className={`py-3 px-4 rounded-xl border-2 text-lg font-bold transition-all ${btnClass}`}
                  >
                    {label}
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* 回饋按鈕 */}
          {phase === 'feedback' && (
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={showHint}
                className="px-3 py-2 rounded-xl text-sm bg-cream text-warm-text hover:bg-cream/80 transition-colors"
              >
                💡 看提示
              </button>
              <button
                onClick={nextQuestion}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-fossil text-white hover:bg-fossil/90 transition-colors"
              >
                下一題 →
              </button>
            </div>
          )}

          {/* 遊戲中提示按鈕 */}
          {phase === 'playing' && (
            <div className="flex justify-center">
              <button
                onClick={showHint}
                className="px-3 py-1.5 rounded-lg text-xs text-warm-text-light hover:text-warm-text transition-colors"
              >
                💡 需要提示嗎？
              </button>
            </div>
          )}
        </>
      )}

      {/* 關卡選擇 */}
      <StageSelector
        currentStage={stage}
        onSelect={setStage}
        onOpenCollection={() => setShowCollection(true)}
      />

      {/* 收藏 Modal */}
      <DinoCollection
        isOpen={showCollection}
        onClose={() => setShowCollection(false)}
        data={collection}
      />
    </div>
  )
}
