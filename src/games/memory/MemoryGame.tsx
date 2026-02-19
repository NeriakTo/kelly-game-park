import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import type { Difficulty } from '../../types'
import { shuffle } from '../../utils/random'

const EMOJI_SETS = ['🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸', '🐧', '🦄', '🐝', '🦋', '🐢', '🐬', '🦉', '🌸', '🌺']

const PAIRS_BY_DIFFICULTY: Record<Difficulty, number> = { 1: 4, 2: 6, 3: 8, 4: 10, 5: 12 }

interface Card {
  id: number
  emoji: string
  flipped: boolean
  matched: boolean
}

function createCards(difficulty: Difficulty): Card[] {
  const pairs = PAIRS_BY_DIFFICULTY[difficulty]
  const emojis = shuffle(EMOJI_SETS).slice(0, pairs)
  return shuffle([...emojis, ...emojis].map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  })))
}

export default function MemoryGame() {
  // [FIX Warning #3] Zustand selector
  const currentDifficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)
  const [cards, setCards] = useState(() => createCards(currentDifficulty))
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const wonRef = useRef(false)

  const newGame = useCallback(() => {
    setCards(createCards(currentDifficulty))
    setFlipped([])
    setMoves(0)
    setWon(false)
    wonRef.current = false
    setStartTime(Date.now())
  }, [currentDifficulty])

  useEffect(() => { newGame() }, [currentDifficulty, newGame])

  // Check match
  useEffect(() => {
    if (flipped.length !== 2) return
    const [a, b] = flipped
    const timer = setTimeout(() => {
      setCards((prev) => {
        const next = [...prev]
        if (next[a].emoji === next[b].emoji) {
          next[a] = { ...next[a], matched: true }
          next[b] = { ...next[b], matched: true }
        }
        next[a] = { ...next[a], flipped: false }
        next[b] = { ...next[b], flipped: false }
        return next
      })
      setFlipped([])
      setMoves((m) => m + 1)
    }, 800)
    return () => clearTimeout(timer)
  }, [flipped])

  // Check win
  useEffect(() => {
    if (wonRef.current) return
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setWon(true)
      wonRef.current = true
      const dur = Math.floor((Date.now() - startTime) / 1000)
      addScore({
        gameType: 'memory',
        difficulty: currentDifficulty,
        score: Math.max(1000 - moves * 10 - dur, 100),
        durationSeconds: dur,
      })
    }
  }, [cards, moves, startTime, currentDifficulty, addScore])

  const handleFlip = useCallback((index: number) => {
    if (won || flipped.length >= 2 || cards[index].flipped || cards[index].matched) return
    setCards((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], flipped: true }
      return next
    })
    setFlipped((prev) => [...prev, index])
  }, [won, flipped, cards])

  // [FIX Warning #7] 響應式欄數
  const pairs = PAIRS_BY_DIFFICULTY[currentDifficulty]
  const cols = pairs <= 4 ? 4 : pairs <= 8 ? 4 : 5

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="bg-cream px-3 py-1 rounded-full">步數：{moves}</span>
        <button onClick={newGame} className="flex items-center gap-1 px-3 py-1.5 bg-cream rounded-full hover:bg-cream/80">
          <RotateCcw className="w-4 h-4" /> 重新開始
        </button>
      </div>

      {won && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-mint rounded-2xl px-6 py-3 text-center shadow-lg">
          <p className="text-2xl font-bold">🎉 全部配對成功！</p>
          <p className="text-sm text-warm-text-light">用了 {moves} 步</p>
        </motion.div>
      )}

      {/* [FIX Warning #7] 使用 auto-fit + minmax 確保小螢幕不溢出 */}
      <div
        className="grid gap-3 w-full max-w-md justify-items-center"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card, i) => (
          <motion.button
            key={card.id}
            onClick={() => handleFlip(i)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={card.matched ? `已配對 ${card.emoji}` : card.flipped ? card.emoji : `翻牌 第${i + 1}張`}
            className={`w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-md transition-colors ${
              card.matched ? 'bg-mint/50 shadow-none' : card.flipped ? 'bg-white' : 'bg-pink cursor-pointer hover:bg-pink/80'
            }`}
          >
            {card.flipped || card.matched ? card.emoji : '❓'}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
