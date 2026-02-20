import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Lightbulb, Check } from 'lucide-react'
import { generateSudoku, checkBoard } from './generator'
import { useGameStore } from '../../stores/gameStore'

type Board = (number | null)[][]

function findDuplicateCells(board: Board): Set<string> {
  const dup = new Set<string>()

  // Row
  for (let r = 0; r < 9; r++) {
    const posMap = new Map<number, number[]>()
    for (let c = 0; c < 9; c++) {
      const v = board[r][c]
      if (!v) continue
      const arr = posMap.get(v) ?? []
      arr.push(c)
      posMap.set(v, arr)
    }
    for (const [, cols] of posMap) {
      if (cols.length > 1) cols.forEach((c) => dup.add(`${r}-${c}`))
    }
  }

  // Col
  for (let c = 0; c < 9; c++) {
    const posMap = new Map<number, number[]>()
    for (let r = 0; r < 9; r++) {
      const v = board[r][c]
      if (!v) continue
      const arr = posMap.get(v) ?? []
      arr.push(r)
      posMap.set(v, arr)
    }
    for (const [, rows] of posMap) {
      if (rows.length > 1) rows.forEach((r) => dup.add(`${r}-${c}`))
    }
  }

  // Box
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const posMap = new Map<number, [number, number][]>()
      for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
          const v = board[r][c]
          if (!v) continue
          const arr = posMap.get(v) ?? []
          arr.push([r, c])
          posMap.set(v, arr)
        }
      }
      for (const [, cells] of posMap) {
        if (cells.length > 1) cells.forEach(([r, c]) => dup.add(`${r}-${c}`))
      }
    }
  }

  return dup
}

export default function SudokuGame() {
  const currentDifficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)
  const [{ puzzle, solution }, setGame] = useState(() => generateSudoku(currentDifficulty))
  const [board, setBoard] = useState<Board>(() => puzzle.map((r) => [...r]))
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [duplicateErrors, setDuplicateErrors] = useState<Set<string>>(new Set())
  const [won, setWon] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [hints, setHints] = useState(0)
  const [popupMsg, setPopupMsg] = useState<string | null>(null)

  const isOriginal = useCallback(
    (r: number, c: number) => puzzle[r][c] !== null,
    [puzzle],
  )

  const newGame = useCallback(() => {
    const g = generateSudoku(currentDifficulty)
    setGame(g)
    setBoard(g.puzzle.map((r) => [...r]))
    setSelected(null)
    setErrors(new Set())
    setDuplicateErrors(new Set())
    setPopupMsg(null)
    setWon(false)
    setHints(0)
    setStartTime(Date.now())
  }, [currentDifficulty])

  useEffect(() => { newGame() }, [currentDifficulty, newGame])

  const recordScore = useCallback(() => {
    const duration = Math.floor((Date.now() - startTime) / 1000)
    addScore({
      gameType: 'sudoku',
      difficulty: currentDifficulty,
      score: Math.max(1000 - duration * 2 - hints * 50, 100),
      durationSeconds: duration,
    })
  }, [startTime, hints, currentDifficulty, addScore])

  const placeNumber = useCallback(
    (num: number | null) => {
      if (!selected || isOriginal(selected[0], selected[1]) || won) return
      const [r, c] = selected
      const next = board.map((row) => [...row])
      next[r][c] = num
      setBoard(next)

      const key = `${r}-${c}`
      if (num !== null && num !== solution[r][c]) {
        setErrors((prev) => new Set(prev).add(key))
      } else {
        setErrors((prev) => {
          const s = new Set(prev)
          s.delete(key)
          return s
        })
      }

      const dup = findDuplicateCells(next)
      setDuplicateErrors(dup)
      if (dup.size > 0) {
        setPopupMsg('⚠️ 發現重複數字：同一行／列／九宮格不可重複')
        setTimeout(() => setPopupMsg(null), 1400)
      }

      if (num !== null && dup.size === 0 && checkBoard(next)) {
        setWon(true)
        recordScore()
      }
    },
    [selected, board, solution, isOriginal, won, recordScore],
  )

  const giveHint = useCallback(() => {
    if (!selected || isOriginal(selected[0], selected[1]) || won) return
    const [r, c] = selected
    placeNumber(solution[r][c])
    setHints((h) => h + 1)
  }, [selected, isOriginal, won, solution, placeNumber])

  const handleCheck = useCallback(() => {
    if (duplicateErrors.size > 0) {
      setPopupMsg('⚠️ 請先修正重複數字再檢查完成')
      setTimeout(() => setPopupMsg(null), 1400)
      return
    }
    if (checkBoard(board)) {
      setWon(true)
      recordScore()
    } else {
      setPopupMsg('還沒完成喔，再試試看！')
      setTimeout(() => setPopupMsg(null), 1200)
    }
  }, [board, duplicateErrors.size, recordScore])

  return (
    <div className="flex flex-col items-center gap-4">
      {popupMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-pink-light border border-pink rounded-xl px-4 py-2 text-sm font-medium text-red-700"
        >
          {popupMsg}
        </motion.div>
      )}

      {won && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-mint rounded-2xl px-6 py-3 text-center shadow-lg"
        >
          <p className="text-2xl font-bold">🎉 太棒了！</p>
          <p className="text-sm text-warm-text-light">
            用時 {Math.floor((Date.now() - startTime) / 1000)} 秒
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-9 gap-0 border-2 border-warm-text/30 rounded-lg overflow-hidden bg-white">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const sel = selected?.[0] === r && selected?.[1] === c
            const orig = isOriginal(r, c)
            const err = errors.has(`${r}-${c}`)
            const dup = duplicateErrors.has(`${r}-${c}`)
            const borderR = c % 3 === 2 && c < 8 ? 'border-r-2 border-r-warm-text/30' : 'border-r border-r-warm-text/10'
            const borderB = r % 3 === 2 && r < 8 ? 'border-b-2 border-b-warm-text/30' : 'border-b border-b-warm-text/10'

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelected([r, c])}
                aria-label={`第${r + 1}行第${c + 1}列 ${cell ? `數字${cell}` : '空格'}`}
                className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-lg font-bold transition-colors
                  ${borderR} ${borderB}
                  ${sel ? 'bg-mint/50' : ''}
                  ${orig ? 'text-warm-text' : 'text-sky-600'}
                  ${err ? 'bg-pink/40 text-red-500' : ''}
                  ${dup ? 'bg-red-200 text-red-700 ring-2 ring-red-400 ring-inset animate-pulse' : ''}
                `}
              >
                {cell || ''}
              </button>
            )
          }),
        )}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => placeNumber(n)}
            aria-label={`填入數字 ${n}`}
            className="w-10 h-10 rounded-xl bg-white shadow-sm hover:bg-mint/30 font-bold text-lg transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => placeNumber(null)}
          aria-label="清除數字"
          className="w-10 h-10 rounded-xl bg-pink-light shadow-sm hover:bg-pink/30 font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={newGame} className="flex items-center gap-1 px-4 py-2 bg-cream rounded-full text-sm font-medium hover:bg-cream/80 transition-colors">
          <RotateCcw className="w-4 h-4" /> 新遊戲
        </button>
        <button onClick={giveHint} className="flex items-center gap-1 px-4 py-2 bg-sky-light rounded-full text-sm font-medium hover:bg-sky/50 transition-colors">
          <Lightbulb className="w-4 h-4" /> 提示 ({hints})
        </button>
        <button
          onClick={handleCheck}
          className="flex items-center gap-1 px-4 py-2 bg-mint rounded-full text-sm font-medium hover:bg-mint/80 transition-colors"
        >
          <Check className="w-4 h-4" /> 檢查
        </button>
      </div>
    </div>
  )
}
