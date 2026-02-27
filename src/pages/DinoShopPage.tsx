import DifficultySelector from '../components/UI/DifficultySelector'
import DinoShopGame from '../games/dino-shop/DinoShopGame'

export default function DinoShopPage() {
  return (
    <div className="h-full space-y-3">
      <section className="lg:hidden bg-white/65 rounded-2xl p-4">
        <h2 className="text-2xl font-bold">🦕 達克比的恐龍商店</h2>
        <p className="text-warm-text-light text-sm mt-1 mb-3">用硬幣買恐龍，練習金額計算</p>
        <DifficultySelector />
      </section>

      <section className="bg-white/40 rounded-2xl p-3 flex items-start justify-center overflow-auto">
        <DinoShopGame />
      </section>
    </div>
  )
}
