import { motion } from 'framer-motion'
import GameCard from '../components/GameCard/GameCard'
import { useGameStore } from '../stores/gameStore'
import type { GameInfo } from '../types'

const GAMES: GameInfo[] = [
  {
    id: 'sudoku',
    name: '數獨',
    description: '填入數字，訓練邏輯推理',
    icon: '🔢',
    color: '#D0F0DC',
    path: '/sudoku',
    available: true,
  },
  {
    id: 'chess',
    name: '中國象棋',
    description: '與 AI 對弈，策略思考',
    icon: '♟️',
    color: '#FFF3CD',
    path: '/chess',
    available: true,
  },
  {
    id: 'memory',
    name: '記憶翻牌',
    description: '翻開配對，訓練記憶力',
    icon: '🃏',
    color: '#FDE8F0',
    path: '/memory',
    available: true,
  },
  {
    id: 'typing',
    name: '中/英打字練習',
    description: '練習速度與正確率',
    icon: '⌨️',
    color: '#E6F4FF',
    path: '/typing',
    available: true,
  },
  {
    id: 'math',
    name: '數學挑戰',
    description: '依年級出題，邊玩邊學',
    icon: '🧮',
    color: '#D6E8F5',
    path: '/math',
    available: true,
  },
  {
    id: 'dino-shop',
    name: '達克比的恐龍商店',
    description: '用硬幣買恐龍，練習金額計算',
    icon: '🦕',
    color: '#E8C9A0',
    path: '/dino-shop',
    available: true,
  },
  {
    id: 'go',
    name: '圍棋教室',
    description: '從零開始學圍棋，邊玩邊學',
    icon: '⚫',
    color: '#F0DCC0',
    path: '/go',
    available: true,
  },
]

export default function Home() {
  const profile = useGameStore((s) => s.profile)

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold">
          歡迎回來，{profile.nickname}！{profile.avatar}
        </h1>
        <p className="text-warm-text-light mt-2">今天想玩什麼呢？</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GameCard game={game} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
