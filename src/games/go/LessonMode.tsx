import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { GoState, Position, GoProgress } from './types'
import { GO_PROGRESS_KEY } from './types'
import { createStateFromSetup, placeStone } from './engine'
import { LESSONS } from './lessons'
import GoBoard from './GoBoard'
import HintBubble from './HintBubble'

interface LessonModeProps {
  readonly onBack: () => void
}

function loadProgress(): GoProgress {
  try {
    const raw = localStorage.getItem(GO_PROGRESS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { completedLessons: [], gamesPlayed: 0, gamesWon: 0 }
}

function saveProgress(progress: GoProgress): void {
  try {
    localStorage.setItem(GO_PROGRESS_KEY, JSON.stringify(progress))
  } catch {}
}

export default function LessonMode({ onBack }: LessonModeProps) {
  const [progress, setProgress] = useState<GoProgress>(loadProgress)
  const [lessonIndex, setLessonIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [state, setState] = useState<GoState>(() =>
    createStateFromSetup(LESSONS[0].boardSize, LESSONS[0].setup),
  )
  const [hint, setHint] = useState<string | null>(null)
  const [stepCompleted, setStepCompleted] = useState(false)

  const lesson = LESSONS[lessonIndex]
  const step = lesson.steps[stepIndex]

  const startLesson = useCallback((idx: number) => {
    const l = LESSONS[idx]
    setLessonIndex(idx)
    setStepIndex(0)
    setState(createStateFromSetup(l.boardSize, l.setup))
    setHint(null)
    setStepCompleted(false)
  }, [])

  // 當前步驟是否為觀察步驟（targetMoves[stepIndex] === null）
  const currentTarget = lesson.targetMoves[stepIndex] ?? null
  const isObservationStep = currentTarget === null
  // 棋盤鎖定：觀察步驟 或 該步驟已完成
  const boardLocked = isObservationStep || stepCompleted

  const handleCellClick = useCallback(
    (pos: Position) => {
      if (boardLocked) return

      // 只接受目標位置的落子
      if (pos[0] !== currentTarget![0] || pos[1] !== currentTarget![1]) {
        setHint(step.hint ?? '試試看綠色標記的位置！')
        return
      }

      const result = placeStone(state, pos)
      if (!result) {
        setHint('這個位置不能下喔！')
        return
      }

      setState(result)
      setHint(null)
      setStepCompleted(true)
    },
    [state, currentTarget, boardLocked, step],
  )

  const nextStep = useCallback(() => {
    if (stepIndex + 1 < lesson.steps.length) {
      setStepIndex(stepIndex + 1)
      setStepCompleted(false)
      setHint(null)
    } else {
      // 課程完成
      const updated: GoProgress = {
        ...progress,
        completedLessons: progress.completedLessons.includes(lesson.id)
          ? progress.completedLessons
          : [...progress.completedLessons, lesson.id],
      }
      setProgress(updated)
      saveProgress(updated)

      // 進入下一課或回到列表
      if (lessonIndex + 1 < LESSONS.length) {
        startLesson(lessonIndex + 1)
      }
    }
  }, [stepIndex, lesson, lessonIndex, progress, startLesson])

  const canProceed = stepCompleted || isObservationStep

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 棋盤區 */}
        <div className="flex-1 space-y-3">
          {/* 課程標題 */}
          <div className="bg-wood-light/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={onBack}
                className="p-1 rounded-lg hover:bg-wood/30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-warm-text" />
              </button>
              <h3 className="text-lg font-bold text-warm-text">
                📚 第{lessonIndex + 1}課：{lesson.title}
              </h3>
            </div>
            <p className="text-sm text-warm-text-light ml-8">{step.instruction}</p>
          </div>

          {/* 棋盤 */}
          <div className="flex justify-center">
            <GoBoard
              state={state}
              onCellClick={handleCellClick}
              disabled={boardLocked}
              showIllegalMoves={lessonIndex >= 4}
              highlightPositions={
                !stepCompleted && currentTarget
                  ? [currentTarget]
                  : []
              }
            />
          </div>

          {/* 提示 */}
          <div className="flex justify-center">
            <HintBubble message={hint} />
          </div>

          {/* 下一步 */}
          <div className="flex justify-center gap-3">
            {step.hint && !hint && !stepCompleted && !isObservationStep && (
              <button
                onClick={() => setHint(step.hint!)}
                className="px-3 py-2 rounded-xl text-sm bg-cream text-warm-text hover:bg-cream/80 transition-colors"
              >
                💡 提示
              </button>
            )}
            {canProceed && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={nextStep}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-wood text-white hover:bg-wood/90 transition-colors flex items-center gap-1.5"
              >
                {stepIndex + 1 < lesson.steps.length ? (
                  <>
                    下一步 <ChevronRight className="w-4 h-4" />
                  </>
                ) : lessonIndex + 1 < LESSONS.length ? (
                  <>
                    下一課 <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    完成！ <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* 課程列表（桌面側欄 / 手機收合） */}
        <div className="lg:w-48 shrink-0">
          <div className="bg-white/60 rounded-xl p-3 space-y-1.5">
            <h4 className="text-xs font-bold text-warm-text-light mb-2">課程進度</h4>
            {LESSONS.map((l, idx) => {
              const isComplete = progress.completedLessons.includes(l.id)
              const isCurrent = idx === lessonIndex
              return (
                <button
                  key={l.id}
                  onClick={() => startLesson(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-wood text-white font-bold'
                      : isComplete
                        ? 'bg-wood-light/40 text-warm-text'
                        : 'text-warm-text-light hover:bg-wood-light/20'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  ) : isCurrent ? (
                    <span className="shrink-0">👉</span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-warm-text-light/40 shrink-0" />
                  )}
                  <span className="truncate">
                    {idx + 1}. {l.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
