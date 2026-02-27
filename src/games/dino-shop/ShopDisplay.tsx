import { motion } from 'framer-motion'
import type { ShopItem } from './types'

interface ShopDisplayProps {
  readonly items: readonly ShopItem[]
  readonly highlightedId?: string
  readonly onSelect?: (item: ShopItem) => void
  readonly selectable?: boolean
}

export default function ShopDisplay({
  items,
  highlightedId,
  onSelect,
  selectable = false,
}: ShopDisplayProps) {
  if (items.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
      {items.map((item, i) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => selectable && onSelect?.(item)}
          disabled={!selectable}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
            highlightedId === item.id
              ? 'border-fossil bg-fossil-light/40 shadow-md'
              : 'border-fossil-light/30 bg-white/60'
          } ${selectable ? 'cursor-pointer hover:border-fossil hover:shadow-sm active:scale-95' : ''}`}
        >
          <span className="text-2xl">{item.emoji}</span>
          <span className="text-xs font-medium text-warm-text">{item.name}</span>
          <span className="text-sm font-bold text-fossil">{item.price} 元</span>
        </motion.button>
      ))}
    </div>
  )
}
