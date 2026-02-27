import { motion } from 'framer-motion'
import type { StoneColor } from './types'

interface GoStoneProps {
  readonly color: StoneColor
  readonly isLastMove?: boolean
  readonly isInDanger?: boolean
  readonly size: number
}

export default function GoStone({ color, isLastMove = false, isInDanger = false, size }: GoStoneProps) {
  const stoneSize = size * 0.85

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className="relative flex items-center justify-center"
      style={{ width: stoneSize, height: stoneSize }}
    >
      {/* 棋子本體 */}
      <div
        className="rounded-full w-full h-full"
        style={{
          background:
            color === 'black'
              ? 'radial-gradient(circle at 35% 35%, #666, #111 60%, #000)'
              : 'radial-gradient(circle at 35% 35%, #fff, #e8e8e8 50%, #ccc)',
          boxShadow:
            color === 'black'
              ? '2px 2px 4px rgba(0,0,0,0.5)'
              : '2px 2px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(0,0,0,0.1)',
        }}
      />

      {/* 最後落子標記 */}
      {isLastMove && (
        <div
          className="absolute rounded-full"
          style={{
            width: stoneSize * 0.3,
            height: stoneSize * 0.3,
            backgroundColor: color === 'black' ? '#fff' : '#000',
            opacity: 0.6,
          }}
        />
      )}

      {/* 危險脈衝（1氣群） */}
      {isInDanger && (
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-red-500"
        />
      )}
    </motion.div>
  )
}
