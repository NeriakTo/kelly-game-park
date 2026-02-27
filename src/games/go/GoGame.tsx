import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Gamepad2 } from 'lucide-react'
import LessonMode from './LessonMode'
import PlayMode from './PlayMode'

type Mode = 'menu' | 'lesson' | 'play'

export default function GoGame() {
  const [mode, setMode] = useState<Mode>('menu')

  if (mode === 'lesson') {
    return <LessonMode onBack={() => setMode('menu')} />
  }

  if (mode === 'play') {
    return <PlayMode onBack={() => setMode('menu')} />
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-5xl mb-3">⚫</div>
        <h2 className="text-2xl font-bold text-warm-text">圍棋教室</h2>
        <p className="text-sm text-warm-text-light mt-1">從零開始學圍棋，邊玩邊學！</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 px-4">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setMode('lesson')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-wood-light/60 border-2 border-wood/30 hover:border-wood hover:shadow-md transition-all text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-wood/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-warm-text" />
          </div>
          <div>
            <h3 className="font-bold text-warm-text">📚 圍棋課程</h3>
            <p className="text-xs text-warm-text-light mt-0.5">
              8 堂課，從放棋子到數地，一步步學會圍棋
            </p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setMode('play')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-cream-light/60 border-2 border-cream/30 hover:border-cream hover:shadow-md transition-all text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-cream/30 flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-warm-text" />
          </div>
          <div>
            <h3 className="font-bold text-warm-text">🎮 與 AI 對弈</h3>
            <p className="text-xs text-warm-text-light mt-0.5">
              9×9 小棋盤，難度跟著左邊選擇走，邊下邊學
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
