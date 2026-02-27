import { motion, AnimatePresence } from 'framer-motion'
import type { CoinValue } from './types'
import { COIN_VALUES, COIN_COLORS } from './types'

interface CoinPanelProps {
  readonly paidCoins: readonly CoinValue[]
  readonly onAddCoin: (value: CoinValue) => void
  readonly onRemoveCoin: (index: number) => void
  readonly onConfirm: () => void
  readonly onClear: () => void
  readonly disabled?: boolean
}

function CoinButton({
  value,
  onClick,
  size = 'md',
}: {
  value: CoinValue
  onClick: () => void
  size?: 'sm' | 'md'
}) {
  const colors = COIN_COLORS[value]
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-12 h-12 text-sm'

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`${sizeClass} rounded-full font-bold shadow-md border-2 select-none active:shadow-sm transition-shadow`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {value}
    </motion.button>
  )
}

export default function CoinPanel({
  paidCoins,
  onAddCoin,
  onRemoveCoin,
  onConfirm,
  onClear,
  disabled = false,
}: CoinPanelProps) {
  const total = paidCoins.reduce((sum, v) => sum + v, 0)

  return (
    <div className="space-y-3">
      {/* 已付款硬幣區 */}
      <div className="bg-white/60 rounded-xl p-3 min-h-[60px] border border-fossil-light/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-warm-text-light">已付款</span>
          <span className="text-sm font-bold text-fossil">合計：{total} 元</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {paidCoins.map((coin, idx) => (
              <motion.div
                key={`${coin}-${idx}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <CoinButton value={coin} onClick={() => onRemoveCoin(idx)} size="sm" />
              </motion.div>
            ))}
          </AnimatePresence>
          {paidCoins.length === 0 && (
            <span className="text-xs text-warm-text-light/60">點下方硬幣來付款</span>
          )}
        </div>
      </div>

      {/* 硬幣面板 */}
      <div className="flex justify-center gap-2 flex-wrap">
        {COIN_VALUES.map((value) => (
          <CoinButton
            key={value}
            value={value}
            onClick={() => !disabled && onAddCoin(value)}
          />
        ))}
      </div>

      {/* 確認/清除按鈕 */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={onClear}
          disabled={disabled || paidCoins.length === 0}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-warm-text-light/30 text-warm-text-light hover:bg-gray-50 disabled:opacity-40 transition-all"
        >
          清除
        </button>
        <button
          onClick={onConfirm}
          disabled={disabled || paidCoins.length === 0}
          className="px-6 py-2 rounded-xl text-sm font-bold bg-fossil text-white hover:bg-fossil/90 disabled:opacity-40 transition-all shadow-sm"
        >
          確認付款
        </button>
      </div>
    </div>
  )
}
