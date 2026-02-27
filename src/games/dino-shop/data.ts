import type { Difficulty } from '../../types'
import type { ShopItem, ShopQuestion, StageId, CoinValue } from './types'
import { COIN_VALUES, getQuestionTypeForStage } from './types'

// ─── 商品資料庫 ───

const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'egg1', name: '小恐龍蛋', emoji: '🥚', price: 5, category: 'egg' },
  { id: 'egg2', name: '大恐龍蛋', emoji: '🥚', price: 35, category: 'egg' },
  { id: 'egg3', name: '金恐龍蛋', emoji: '🥚', price: 120, category: 'egg' },
  { id: 'fossil1', name: '小化石', emoji: '🦴', price: 10, category: 'fossil' },
  { id: 'fossil2', name: '恐龍牙齒', emoji: '🦷', price: 25, category: 'fossil' },
  { id: 'fossil3', name: '恐龍爪子', emoji: '🦴', price: 45, category: 'fossil' },
  { id: 'fossil4', name: '恐龍頭骨', emoji: '💀', price: 80, category: 'fossil' },
  { id: 'fossil5', name: '完整骨架', emoji: '🦕', price: 200, category: 'fossil' },
  { id: 'tool1', name: '小刷子', emoji: '🖌️', price: 8, category: 'tool' },
  { id: 'tool2', name: '挖掘錘', emoji: '🔨', price: 15, category: 'tool' },
  { id: 'tool3', name: '放大鏡', emoji: '🔍', price: 30, category: 'tool' },
  { id: 'tool4', name: '探險背包', emoji: '🎒', price: 60, category: 'tool' },
  { id: 'model1', name: '暴龍模型', emoji: '🦖', price: 50, category: 'model' },
  { id: 'model2', name: '三角龍模型', emoji: '🦕', price: 55, category: 'model' },
  { id: 'model3', name: '翼龍模型', emoji: '🦅', price: 70, category: 'model' },
  { id: 'food1', name: '恐龍餅乾', emoji: '🍪', price: 3, category: 'food' },
  { id: 'food2', name: '化石巧克力', emoji: '🍫', price: 12, category: 'food' },
  { id: 'food3', name: '恐龍果汁', emoji: '🧃', price: 20, category: 'food' },
] as const

// ─── 工具函式 ───

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickRandomN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function buildOptions(answer: number, count: number = 4): readonly number[] {
  const opts = new Set<number>([answer])
  const offsets = [1, 2, 3, 5, 10, 15, 20]
  while (opts.size < count) {
    const offset = pickRandom(offsets)
    const candidate = Math.random() > 0.5 ? answer + offset : Math.max(1, answer - offset)
    if (candidate !== answer && candidate > 0) opts.add(candidate)
  }
  return [...opts].sort(() => Math.random() - 0.5)
}

function getItemsByPriceRange(min: number, max: number): readonly ShopItem[] {
  return SHOP_ITEMS.filter((item) => item.price >= min && item.price <= max)
}

// ─── 題目生成器 ───

function generateRecognizeCoins(): ShopQuestion {
  // 認識硬幣：顯示幾個硬幣，問合計多少
  const coinCounts: [CoinValue, number][] = []
  const usableCoins: CoinValue[] = [1, 5, 10, 50]
  const numTypes = rand(2, 3)
  const picked = pickRandomN(usableCoins, numTypes)
  let total = 0
  for (const coin of picked) {
    const count = rand(1, 3)
    coinCounts.push([coin, count])
    total += coin * count
  }
  const coinDesc = coinCounts.map(([v, c]) => `${v}元×${c}`).join('、')
  return {
    type: 'recognize-coins',
    description: `數數看，${coinDesc} 一共是多少元？`,
    items: [],
    targetAmount: total,
    options: buildOptions(total),
    hint: '把每種硬幣的金額加起來就對了！',
    answer: total,
  }
}

function generateExactPayment(): ShopQuestion {
  // 單品付款：用硬幣付正確金額
  const items = getItemsByPriceRange(5, 60)
  const item = pickRandom(items)
  return {
    type: 'exact-payment',
    description: `${item.emoji} ${item.name}要 ${item.price} 元，請用硬幣付剛好的金額！`,
    items: [item],
    targetAmount: item.price,
    hint: `想想看，怎麼湊出剛好 ${item.price} 元？`,
    answer: item.price,
    coinPayment: true,
  }
}

function generateCalculateChange(): ShopQuestion {
  // 找零：付了多少錢，要找回多少
  const items = getItemsByPriceRange(5, 80)
  const item = pickRandom(items)
  const paidOptions = COIN_VALUES.filter((v) => v > item.price)
  const paid = paidOptions.length > 0 ? pickRandom(paidOptions) : item.price + rand(5, 20)
  const change = paid - item.price
  return {
    type: 'calculate-change',
    description: `${item.emoji} ${item.name} ${item.price} 元，付了 ${paid} 元，要找回多少？`,
    items: [item],
    targetAmount: change,
    options: buildOptions(change),
    hint: `${paid} - ${item.price} = ?`,
    answer: change,
  }
}

function generateMultipleItems(): ShopQuestion {
  // 多品合計：算出總價
  const items = pickRandomN(getItemsByPriceRange(5, 50), rand(2, 3))
  const total = items.reduce((sum, item) => sum + item.price, 0)
  const itemDesc = items.map((i) => `${i.emoji}${i.name}(${i.price}元)`).join('、')
  return {
    type: 'multiple-items',
    description: `買了 ${itemDesc}，一共要付多少元？`,
    items,
    targetAmount: total,
    options: buildOptions(total),
    hint: '把每樣東西的價格加起來！',
    answer: total,
  }
}

function generateBudgetCheck(): ShopQuestion {
  // 預算管理：N元能買什麼（選出能買得起的最貴組合）
  const budget = pickRandom([50, 100, 150, 200])
  const candidates = pickRandomN(getItemsByPriceRange(10, budget + 30), 4)
  // 找出 budget 內最貴的那個
  const affordable = candidates.filter((i) => i.price <= budget)
  const mostExpensive = affordable.length > 0
    ? affordable.reduce((a, b) => (a.price > b.price ? a : b))
    : candidates.reduce((a, b) => (a.price < b.price ? a : b))
  return {
    type: 'budget-check',
    description: `你有 ${budget} 元，下面哪個買得起而且最貴？`,
    items: candidates,
    budget,
    options: candidates.map((i) => i.price),
    hint: `找出 ${budget} 元以內最貴的東西！`,
    answer: mostExpensive.price,
  }
}

function generateComparePrices(): ShopQuestion {
  // 比價：選最便宜或最貴
  const items = pickRandomN(SHOP_ITEMS, 4)
  const cheapest = items.reduce((a, b) => (a.price < b.price ? a : b))
  return {
    type: 'compare-prices',
    description: '哪一個最便宜？',
    items,
    options: items.map((i) => i.price),
    hint: '比較每樣東西的價格，找最小的數字！',
    answer: cheapest.price,
  }
}

function generateDiscount(): ShopQuestion {
  // 打折：八折/半價
  const items = getItemsByPriceRange(20, 100)
  const item = pickRandom(items)
  const discountType = pickRandom(['half', 'eighty'] as const)
  const discounted = discountType === 'half'
    ? Math.round(item.price / 2)
    : Math.round(item.price * 0.8)
  const discountLabel = discountType === 'half' ? '半價' : '八折'
  return {
    type: 'discount',
    description: `${item.emoji} ${item.name}原價 ${item.price} 元，${discountLabel}是多少元？`,
    items: [item],
    targetAmount: discounted,
    options: buildOptions(discounted),
    hint: discountType === 'half'
      ? `半價就是除以 2：${item.price} ÷ 2 = ?`
      : `八折就是乘以 0.8：${item.price} × 0.8 = ?`,
    answer: discounted,
  }
}

function generateMultiStep(): ShopQuestion {
  // 多步驟：買東西 → 付款 → 找零 → 再買
  const item1 = pickRandom(getItemsByPriceRange(10, 40))
  const item2 = pickRandom(getItemsByPriceRange(5, 30))
  const totalBudget = 100
  const remaining = totalBudget - item1.price - item2.price
  return {
    type: 'multi-step',
    description: `你有 ${totalBudget} 元。先買 ${item1.emoji}${item1.name}(${item1.price}元)，再買 ${item2.emoji}${item2.name}(${item2.price}元)，還剩多少元？`,
    items: [item1, item2],
    budget: totalBudget,
    targetAmount: remaining,
    options: buildOptions(remaining),
    hint: `${totalBudget} - ${item1.price} - ${item2.price} = ?`,
    answer: remaining,
  }
}

function generateTimedShopping(): ShopQuestion {
  // 限時題：其實跟其他題目類似，但標記為限時
  const generators = [generateMultipleItems, generateCalculateChange, generateComparePrices]
  const q = pickRandom(generators)()
  return { ...q, type: 'timed-shopping' }
}

// ─── 公開 API ───

const GENERATORS: Record<string, () => ShopQuestion> = {
  'recognize-coins': generateRecognizeCoins,
  'exact-payment': generateExactPayment,
  'calculate-change': generateCalculateChange,
  'multiple-items': generateMultipleItems,
  'budget-check': generateBudgetCheck,
  'compare-prices': generateComparePrices,
  'discount': generateDiscount,
  'multi-step': generateMultiStep,
  'timed-shopping': generateTimedShopping,
}

export function generateQuestion(stage: StageId, difficulty: Difficulty): ShopQuestion {
  const type = getQuestionTypeForStage(stage, difficulty)
  const gen = GENERATORS[type]
  return gen ? gen() : generateRecognizeCoins()
}

export function calculateScore(
  correct: number,
  total: number,
  durationSeconds: number,
): number {
  const accuracy = total > 0 ? (correct / total) * 100 : 0
  return Math.max(100, Math.round(correct * 150 + accuracy * 5 - durationSeconds))
}
