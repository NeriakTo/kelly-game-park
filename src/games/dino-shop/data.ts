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
  let attempts = 0
  while (opts.size < count && attempts < 50) {
    attempts++
    const offset = pickRandom(offsets)
    const candidate = Math.random() > 0.5 ? answer + offset : Math.max(1, answer - offset)
    if (candidate !== answer && candidate > 0) opts.add(candidate)
  }
  while (opts.size < count) opts.add(answer + opts.size)
  return [...opts].sort(() => Math.random() - 0.5)
}

function getItemsByPriceRange(min: number, max: number): readonly ShopItem[] {
  return SHOP_ITEMS.filter((item) => item.price >= min && item.price <= max)
}

// ─── 題目生成器（每種題型含多個模板）───

function generateRecognizeCoins(easy: boolean): ShopQuestion {
  const t = rand(0, 2)
  if (t === 0) {
    // 模板 A：數硬幣數量
    const usable: CoinValue[] = easy ? [1, 5, 10] : [1, 5, 10, 50]
    const coinCounts: [CoinValue, number][] = []
    const picked = pickRandomN(usable, rand(2, 3))
    let total = 0
    for (const coin of picked) {
      const count = rand(1, easy ? 2 : 3)
      coinCounts.push([coin, count])
      total += coin * count
    }
    const coinDesc = coinCounts.map(([v, c]) => `${v}元×${c}`).join('、')
    return {
      type: 'recognize-coins', description: `數數看，${coinDesc} 一共是多少元？`,
      items: [], targetAmount: total, options: buildOptions(total),
      hint: '把每種硬幣的金額加起來就對了！', answer: total,
    }
  }
  if (t === 1) {
    // 模板 B：看圖片認識硬幣面值
    const coin = pickRandom(easy ? [1, 5, 10] as CoinValue[] : [10, 50, 100] as CoinValue[])
    const count = rand(2, easy ? 4 : 6)
    const total = coin * count
    return {
      type: 'recognize-coins', description: `有 ${count} 個 ${coin} 元硬幣，一共多少元？`,
      items: [], targetAmount: total, options: buildOptions(total),
      hint: `${coin} × ${count} = ?`, answer: total,
    }
  }
  // 模板 C：換算問題
  const small = pickRandom(easy ? [1, 5] as CoinValue[] : [5, 10] as CoinValue[])
  const big = pickRandom(easy ? [10] as CoinValue[] : [50, 100] as CoinValue[])
  const howMany = big / small
  return {
    type: 'recognize-coins', description: `1 個 ${big} 元可以換成幾個 ${small} 元？`,
    items: [], targetAmount: howMany, options: buildOptions(howMany),
    hint: `${big} ÷ ${small} = ?`, answer: howMany,
  }
}

function generateExactPayment(easy: boolean): ShopQuestion {
  const maxPrice = easy ? 30 : 60
  const items = getItemsByPriceRange(easy ? 3 : 5, maxPrice)
  const item = pickRandom(items)
  return {
    type: 'exact-payment',
    description: `${item.emoji} ${item.name}要 ${item.price} 元，請用硬幣付剛好的金額！`,
    items: [item], targetAmount: item.price,
    hint: `想想看，怎麼湊出剛好 ${item.price} 元？`, answer: item.price, coinPayment: true,
  }
}

function generateCalculateChange(easy: boolean): ShopQuestion {
  const t = rand(0, 1)
  if (t === 0) {
    // 模板 A：標準找零
    const maxPrice = easy ? 30 : 80
    const items = getItemsByPriceRange(easy ? 3 : 5, maxPrice)
    const item = pickRandom(items)
    const paidOptions = COIN_VALUES.filter((v) => v > item.price)
    const paid = paidOptions.length > 0 ? pickRandom(paidOptions) : item.price + rand(5, 20)
    const change = paid - item.price
    return {
      type: 'calculate-change',
      description: `${item.emoji} ${item.name} ${item.price} 元，付了 ${paid} 元，要找回多少？`,
      items: [item], targetAmount: change, options: buildOptions(change),
      hint: `${paid} - ${item.price} = ?`, answer: change,
    }
  }
  // 模板 B：買兩樣找零
  const items = pickRandomN(getItemsByPriceRange(easy ? 3 : 5, easy ? 20 : 40), 2)
  const totalPrice = items.reduce((s, i) => s + i.price, 0)
  const paidOptions = COIN_VALUES.filter((v) => v > totalPrice)
  const paid = paidOptions.length > 0 ? pickRandom(paidOptions) : totalPrice + rand(10, 30)
  const change = paid - totalPrice
  const desc = items.map((i) => `${i.emoji}${i.name}(${i.price}元)`).join('和')
  return {
    type: 'calculate-change',
    description: `買了${desc}，付了 ${paid} 元，找回多少？`,
    items, targetAmount: change, options: buildOptions(change),
    hint: `先算總價 ${totalPrice}，再算 ${paid} - ${totalPrice}。`, answer: change,
  }
}

function generateMultipleItems(easy: boolean): ShopQuestion {
  const t = rand(0, 1)
  if (t === 0) {
    // 模板 A：算總價
    const count = easy ? 2 : rand(2, 3)
    const items = pickRandomN(getItemsByPriceRange(easy ? 3 : 5, easy ? 30 : 50), count)
    const total = items.reduce((sum, item) => sum + item.price, 0)
    const itemDesc = items.map((i) => `${i.emoji}${i.name}(${i.price}元)`).join('、')
    return {
      type: 'multiple-items', description: `買了 ${itemDesc}，一共要付多少元？`,
      items, targetAmount: total, options: buildOptions(total),
      hint: '把每樣東西的價格加起來！', answer: total,
    }
  }
  // 模板 B：同一商品買多個
  const items = getItemsByPriceRange(easy ? 3 : 5, easy ? 20 : 50)
  const item = pickRandom(items)
  const qty = rand(2, easy ? 3 : 5)
  const total = item.price * qty
  return {
    type: 'multiple-items',
    description: `${item.emoji} ${item.name}每個 ${item.price} 元，買 ${qty} 個要多少元？`,
    items: [item], targetAmount: total, options: buildOptions(total),
    hint: `${item.price} × ${qty} = ?`, answer: total,
  }
}

function generateBudgetCheck(easy: boolean): ShopQuestion {
  const t = rand(0, 1)
  if (t === 0) {
    // 模板 A：哪個買得起且最貴
    const budget = easy ? pickRandom([30, 50]) : pickRandom([50, 100, 150, 200])
    const candidates = pickRandomN(getItemsByPriceRange(easy ? 3 : 10, budget + 30), 4)
    const affordable = candidates.filter((i) => i.price <= budget)
    const mostExpensive = affordable.length > 0
      ? affordable.reduce((a, b) => (a.price > b.price ? a : b))
      : candidates.reduce((a, b) => (a.price < b.price ? a : b))
    return {
      type: 'budget-check',
      description: `你有 ${budget} 元，下面哪個買得起而且最貴？`,
      items: candidates, budget, options: candidates.map((i) => i.price),
      hint: `找出 ${budget} 元以內最貴的東西！`, answer: mostExpensive.price,
    }
  }
  // 模板 B：夠不夠買
  const budget = easy ? pickRandom([50, 100]) : pickRandom([100, 200, 300])
  const items = pickRandomN(getItemsByPriceRange(easy ? 3 : 10, easy ? 30 : 80), easy ? 2 : 3)
  const total = items.reduce((s, i) => s + i.price, 0)
  const enough = total <= budget ? 1 : 0
  const itemDesc = items.map((i) => `${i.emoji}${i.name}(${i.price}元)`).join('、')
  return {
    type: 'budget-check',
    description: `你有 ${budget} 元，買 ${itemDesc} 夠嗎？（夠=1，不夠=0）`,
    items, budget, options: [0, 1].sort(() => Math.random() - 0.5),
    hint: `先算總價 ${total} 元，再跟 ${budget} 元比較。`, answer: enough,
  }
}

function generateComparePrices(easy: boolean): ShopQuestion {
  const t = rand(0, 1)
  if (t === 0) {
    // 模板 A：找最便宜的
    const items = pickRandomN(easy ? getItemsByPriceRange(3, 30) : SHOP_ITEMS, 4)
    const cheapest = items.reduce((a, b) => (a.price < b.price ? a : b))
    return {
      type: 'compare-prices', description: '哪一個最便宜？',
      items, options: items.map((i) => i.price),
      hint: '比較每樣東西的價格，找最小的數字！', answer: cheapest.price,
    }
  }
  // 模板 B：找最貴的
  const items = pickRandomN(easy ? getItemsByPriceRange(3, 50) : SHOP_ITEMS, 4)
  const most = items.reduce((a, b) => (a.price > b.price ? a : b))
  return {
    type: 'compare-prices', description: '哪一個最貴？',
    items, options: items.map((i) => i.price),
    hint: '比較每樣東西的價格，找最大的數字！', answer: most.price,
  }
}

function generateDiscount(easy: boolean): ShopQuestion {
  const t = rand(0, 2)
  const items = getItemsByPriceRange(easy ? 10 : 20, easy ? 50 : 100)
  const item = pickRandom(items)
  if (t === 0) {
    // 半價
    const ans = Math.round(item.price / 2)
    return {
      type: 'discount',
      description: `${item.emoji} ${item.name}原價 ${item.price} 元，半價是多少元？`,
      items: [item], targetAmount: ans, options: buildOptions(ans),
      hint: `半價就是除以 2：${item.price} ÷ 2 = ?`, answer: ans,
    }
  }
  if (t === 1) {
    // 八折
    const ans = Math.round(item.price * 0.8)
    return {
      type: 'discount',
      description: `${item.emoji} ${item.name}原價 ${item.price} 元，八折是多少元？`,
      items: [item], targetAmount: ans, options: buildOptions(ans),
      hint: `八折就是乘以 0.8：${item.price} × 0.8 = ?`, answer: ans,
    }
  }
  // 買一送一相當於半價
  const ans = Math.round(item.price / 2)
  return {
    type: 'discount',
    description: `${item.emoji} ${item.name} ${item.price} 元，買一送一等於每個多少元？`,
    items: [item], targetAmount: ans, options: buildOptions(ans),
    hint: '買一送一就是兩個的價錢除以二。', answer: ans,
  }
}

function generateMultiStep(easy: boolean): ShopQuestion {
  const t = rand(0, 1)
  if (t === 0) {
    // 模板 A：買東西→找零→再買
    const item1 = pickRandom(getItemsByPriceRange(easy ? 5 : 10, easy ? 20 : 40))
    const item2 = pickRandom(getItemsByPriceRange(easy ? 3 : 5, easy ? 15 : 30))
    const totalBudget = easy ? 50 : 100
    const remaining = totalBudget - item1.price - item2.price
    return {
      type: 'multi-step',
      description: `你有 ${totalBudget} 元。先買 ${item1.emoji}${item1.name}(${item1.price}元)，再買 ${item2.emoji}${item2.name}(${item2.price}元)，還剩多少元？`,
      items: [item1, item2], budget: totalBudget, targetAmount: remaining, options: buildOptions(remaining),
      hint: `${totalBudget} - ${item1.price} - ${item2.price} = ?`, answer: remaining,
    }
  }
  // 模板 B：比較兩種購買方案
  const item = pickRandom(getItemsByPriceRange(easy ? 5 : 10, easy ? 30 : 50))
  const qty1 = rand(2, 3), qty2 = rand(4, 5)
  const diff = item.price * (qty2 - qty1)
  return {
    type: 'multi-step',
    description: `${item.emoji} ${item.name}每個 ${item.price} 元，買 ${qty2} 個比買 ${qty1} 個多花多少元？`,
    items: [item], targetAmount: diff, options: buildOptions(diff),
    hint: `先分別算出兩種的總價再相減。`, answer: diff,
  }
}

function generateTimedShopping(easy: boolean): ShopQuestion {
  const generators = [generateMultipleItems, generateCalculateChange, generateComparePrices]
  const q = pickRandom(generators)(easy)
  return { ...q, type: 'timed-shopping' }
}

// ─── 公開 API ───

const GENERATORS: Record<string, (easy: boolean) => ShopQuestion> = {
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

export function generateQuestion(stage: StageId, difficulty: Difficulty, easy: boolean = false): ShopQuestion {
  const type = getQuestionTypeForStage(stage, difficulty)
  const gen = GENERATORS[type]
  return gen ? gen(easy) : generateRecognizeCoins(easy)
}

export function calculateScore(
  correct: number,
  total: number,
  durationSeconds: number,
): number {
  const accuracy = total > 0 ? (correct / total) * 100 : 0
  return Math.max(100, Math.round(correct * 150 + accuracy * 5 - durationSeconds))
}
