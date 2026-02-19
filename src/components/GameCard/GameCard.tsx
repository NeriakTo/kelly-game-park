import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { GameInfo } from '../../types'

export default function GameCard({ game }: { game: GameInfo }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Link
        to={game.available ? game.path : '#'}
        className={`block rounded-2xl p-6 shadow-md transition-shadow hover:shadow-lg ${
          game.available ? '' : 'opacity-50 pointer-events-none'
        }`}
        style={{ backgroundColor: game.color }}
      >
        <div className="text-4xl mb-3">{game.icon}</div>
        <h3 className="text-lg font-bold text-warm-text">{game.name}</h3>
        <p className="text-sm text-warm-text-light mt-1">{game.description}</p>
        {!game.available && (
          <span className="absolute top-3 right-3 text-xs bg-white/60 rounded-full px-2 py-0.5">
            即將推出
          </span>
        )}
      </Link>
    </motion.div>
  )
}
