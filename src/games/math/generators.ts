/**
 * 數學挑戰 — 題目生成器
 * 依 108 課綱對齊各年級單元與課綱標籤
 * 每個單元 3-4 種題型模板，隨機選取避免重複
 * easy 參數用於答錯後自動降低難度
 */

export type Grade = 1 | 2 | 3 | 4 | 5 | 6

export interface Unit {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly curriculumTag: string
}

export interface Problem {
  readonly text: string
  readonly answer: number
  readonly hint: string
  readonly unitId: string
  readonly curriculumTag: string
}

// ─── 工具函式 ───

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function r1(n: number): number {
  return Number(n.toFixed(1))
}

const THINGS = ['顆糖果', '個蘋果', '朵花', '張貼紙', '塊積木', '枝鉛筆', '本書', '顆球'] as const
const NAMES = ['小明', '小華', '小美', '阿寶', '小芳'] as const

export function gradeToDifficulty(grade: Grade): 1 | 2 | 3 {
  if (grade <= 2) return 1
  if (grade <= 4) return 2
  return 3
}

// ─── 年級單元（108 課綱對齊）───

export const GRADE_UNITS: Record<Grade, readonly Unit[]> = {
  1: [
    { id: 'g1-addsub', name: '20內加減法', description: '基本加減法，熟練1-10的加減', curriculumTag: 'N-1-3' },
    { id: 'g1-number', name: '認識數字', description: '100以內的數與位值概念', curriculumTag: 'N-1-1' },
    { id: 'g1-money', name: '認識錢幣', description: '1、5、10、50、100元的認識', curriculumTag: 'N-1-4' },
    { id: 'g1-compare', name: '大小比較', description: '數的比較與大小關係', curriculumTag: 'R-2-1' },
  ],
  2: [
    { id: 'g2-addsub', name: '三位數加減', description: '含進位加法與退位減法', curriculumTag: 'N-2-2' },
    { id: 'g2-multiply', name: '乘法九九', description: '乘法意義與九九乘法表', curriculumTag: 'N-2-7' },
    { id: 'g2-money', name: '錢幣應用', description: '100、500、1000元解題', curriculumTag: 'N-2-5' },
    { id: 'g2-twostep', name: '兩步驟問題', description: '加減與乘的混合應用', curriculumTag: 'N-2-8' },
    { id: 'g2-divide', name: '分裝平分', description: '平均分配的前置經驗', curriculumTag: 'N-2-9' },
  ],
  3: [
    { id: 'g3-multiply', name: '多位數乘法', description: '二三位數乘以一位數', curriculumTag: 'N-3-3' },
    { id: 'g3-divide', name: '除法', description: '除法意義與直式計算', curriculumTag: 'N-3-4' },
    { id: 'g3-fraction', name: '分數入門', description: '簡單同分母分數加減', curriculumTag: 'N-3-9' },
    { id: 'g3-decimal', name: '一位小數', description: '認識小數與加減', curriculumTag: 'N-3-10' },
    { id: 'g3-twostep', name: '兩步驟問題', description: '加減乘除混合', curriculumTag: 'N-3-7' },
  ],
  4: [
    { id: 'g4-muldiv', name: '大數乘除', description: '多位數乘除法', curriculumTag: 'N-4-2' },
    { id: 'g4-fraction', name: '分數運算', description: '同分母分數含假分數與帶分數', curriculumTag: 'N-4-5' },
    { id: 'g4-decimal', name: '小數運算', description: '二位小數加減與整數倍', curriculumTag: 'N-4-7' },
    { id: 'g4-area', name: '面積周長', description: '長方形面積與周長公式', curriculumTag: 'S-4-3' },
    { id: 'g4-estimate', name: '概數估算', description: '四捨五入與近似計算', curriculumTag: 'N-4-4' },
  ],
  5: [
    { id: 'g5-fraction', name: '異分母分數', description: '通分與異分母加減法', curriculumTag: 'N-5-4' },
    { id: 'g5-fracmul', name: '分數乘法', description: '整數乘以分數與分數乘分數', curriculumTag: 'N-5-5' },
    { id: 'g5-decimal', name: '小數乘除', description: '小數乘法與除法', curriculumTag: 'N-5-8' },
    { id: 'g5-percent', name: '百分率', description: '比率、百分率與折扣', curriculumTag: 'N-5-10' },
    { id: 'g5-volume', name: '體積', description: '長方體與正方體體積', curriculumTag: 'S-5-5' },
  ],
  6: [
    { id: 'g6-fracdiv', name: '分數除法', description: '分數除以整數與分數', curriculumTag: 'N-6-3' },
    { id: 'g6-decdiv', name: '小數除法', description: '小數除以整數與小數', curriculumTag: 'N-6-4' },
    { id: 'g6-ratio', name: '比與比值', description: '比的意義與等比應用', curriculumTag: 'N-6-6' },
    { id: 'g6-speed', name: '速度問題', description: '距離＝速度×時間', curriculumTag: 'N-6-7' },
    { id: 'g6-circle', name: '圓面積', description: '圓周長與面積計算', curriculumTag: 'S-6-3' },
  ],
}

// ─── 生成器函式 ───

type Gen = (easy: boolean) => Problem
function p(text: string, answer: number, hint: string, unitId: string, tag: string): Problem {
  return { text, answer, hint, unitId, curriculumTag: tag }
}

// --- 一年級 ---

function g1Addsub(easy: boolean): Problem {
  const id = 'g1-addsub', tag = 'N-1-3'
  const mx = easy ? 8 : 18
  switch (rand(0, 3)) {
    case 0: { const a = rand(1, mx), b = rand(1, Math.min(mx, 20 - a)); return p(`${a} + ${b} = ?`, a + b, '從大的數往上數。', id, tag) }
    case 1: { const a = rand(3, mx), b = rand(1, a - 1); return p(`${a} - ${b} = ?`, a - b, '想想看要倒數幾個。', id, tag) }
    case 2: {
      const a = rand(1, easy ? 5 : 10), b = rand(1, easy ? 5 : 10), th = pick(THINGS)
      return p(`${pick(NAMES)}有 ${a} ${th}，又得到 ${b} ${th}，共有幾${th[0]}？`, a + b, '兩個數字加起來。', id, tag)
    }
    default: { const s = rand(5, mx), a = rand(1, s - 1); return p(`${a} + ? = ${s}，? 是多少？`, s - a, `想想 ${s} - ${a}。`, id, tag) }
  }
}

function g1Number(easy: boolean): Problem {
  const id = 'g1-number', tag = 'N-1-1'
  const mx = easy ? 50 : 99
  switch (rand(0, 2)) {
    case 0: { const n = rand(10, mx); return p(`${n} 的十位數字是多少？`, Math.floor(n / 10), '左邊的數字就是十位。', id, tag) }
    case 1: { const t = rand(1, easy ? 5 : 9), o = rand(0, 9); return p(`${t} 個十和 ${o} 個一合起來是多少？`, t * 10 + o, '十個一數，再加個位。', id, tag) }
    default: { const s = rand(1, mx - 5), c = rand(3, 5); return p(`從 ${s} 往後數 ${c} 個，數到多少？`, s + c, '一個一個慢慢數。', id, tag) }
  }
}

function g1Money(easy: boolean): Problem {
  const id = 'g1-money', tag = 'N-1-4'
  switch (rand(0, 2)) {
    case 0: {
      const c5 = rand(0, easy ? 1 : 2), c10 = rand(0, easy ? 1 : 3), c1 = rand(1, easy ? 3 : 5)
      const total = c5 * 5 + c10 * 10 + c1
      const parts = [c10 > 0 ? `10元×${c10}` : '', c5 > 0 ? `5元×${c5}` : '', `1元×${c1}`].filter(Boolean).join('、')
      return p(`${parts} 合起來多少元？`, total, '每種硬幣分開算再加起來。', id, tag)
    }
    case 1: {
      const price = easy ? rand(3, 10) : rand(5, 30)
      const paid = price < 10 ? 10 : price < 50 ? 50 : 100
      return p(`${pick(THINGS)}一個 ${price} 元，付了 ${paid} 元，找回多少元？`, paid - price, `${paid} - ${price} = ?`, id, tag)
    }
    default: {
      const a = rand(1, 5) * 10, b = rand(1, 5) * 10
      return p(`${a} 元和 ${b} 元，哪個比較多？（輸入較大的數）`, Math.max(a, b), '比比看哪個數字大。', id, tag)
    }
  }
}

function g1Compare(easy: boolean): Problem {
  const id = 'g1-compare', tag = 'R-2-1'
  const mx = easy ? 20 : 50
  switch (rand(0, 2)) {
    case 0: { const a = rand(1, mx), b = rand(1, mx); return p(`${a} 和 ${b}，哪個比較大？`, Math.max(a, b), '先看十位再看個位。', id, tag) }
    case 1: { const a = rand(1, mx), b = rand(1, mx); return p(`${a} 比 ${b} 多多少？`, Math.abs(a - b), '大的減小的。', id, tag) }
    default: {
      const nums = [rand(1, mx), rand(1, mx), rand(1, mx)].sort((a, b) => a - b)
      return p(`${nums[0]}、${nums[1]}、${nums[2]} 從小到大排，中間的是？`, nums[1], '先找最小，再找最大。', id, tag)
    }
  }
}

// --- 二年級 ---

function g2Addsub(easy: boolean): Problem {
  const id = 'g2-addsub', tag = 'N-2-2'
  switch (rand(0, 3)) {
    case 0: { const a = rand(easy ? 10 : 50, easy ? 80 : 500), b = rand(10, easy ? 99 - a : 999 - a); return p(`${a} + ${b} = ?`, a + b, '個位、十位分開算，記得進位。', id, tag) }
    case 1: { const a = rand(easy ? 20 : 100, easy ? 99 : 999), b = rand(10, a - 1); return p(`${a} - ${b} = ?`, a - b, '不夠減要先借位。', id, tag) }
    case 2: {
      const a = rand(10, easy ? 50 : 200), b = rand(10, easy ? 50 : 200), th = pick(THINGS)
      return p(`籃子有 ${a} ${th}，又放入 ${b} ${th}，共有幾${th[0]}？`, a + b, '兩堆加起來。', id, tag)
    }
    default: {
      const a = rand(easy ? 20 : 100, easy ? 99 : 500), b = rand(10, easy ? 50 : 300), c = rand(10, easy ? 50 : 200)
      return p(`${a} + ${b} - ${c} = ?`, a + b - c, '先加再減。', id, tag)
    }
  }
}

function g2Multiply(easy: boolean): Problem {
  const id = 'g2-multiply', tag = 'N-2-7'
  const mx = easy ? 5 : 9
  switch (rand(0, 3)) {
    case 0: { const a = rand(2, mx), b = rand(2, mx); return p(`${a} × ${b} = ?`, a * b, '想想九九乘法表。', id, tag) }
    case 1: {
      const a = rand(2, mx), b = rand(2, easy ? 4 : 6)
      return p(`每排 ${a} 個，有 ${b} 排，共幾個？`, a * b, '每排的數量乘以排數。', id, tag)
    }
    case 2: {
      const a = rand(2, mx), b = rand(2, easy ? 4 : 5)
      return p(`${a} 的 ${b} 倍是多少？`, a * b, '倍就是乘。', id, tag)
    }
    default: {
      const a = rand(2, mx), b = rand(2, mx)
      return p(`? × ${b} = ${a * b}，? 是多少？`, a, '想想幾乘 ' + b + ' 等於 ' + (a * b) + '。', id, tag)
    }
  }
}

function g2Money(easy: boolean): Problem {
  const id = 'g2-money', tag = 'N-2-5'
  switch (rand(0, 2)) {
    case 0: {
      const c100 = rand(0, easy ? 2 : 5), c50 = rand(0, 2), c10 = rand(1, 3)
      const total = c100 * 100 + c50 * 50 + c10 * 10
      const parts = [c100 > 0 ? `100元×${c100}` : '', c50 > 0 ? `50元×${c50}` : '', `10元×${c10}`].filter(Boolean).join('、')
      return p(`${parts} 合起來多少元？`, total, '每種硬幣分別算。', id, tag)
    }
    case 1: {
      const price = easy ? rand(20, 80) : rand(50, 300)
      const paid = price <= 100 ? 100 : price <= 500 ? 500 : 1000
      return p(`東西 ${price} 元，付了 ${paid} 元，找回多少元？`, paid - price, `${paid} - ${price} = ?`, id, tag)
    }
    default: {
      const budget = easy ? 100 : 500
      const spent = rand(20, budget - 10)
      return p(`${pick(NAMES)}有 ${budget} 元，花了 ${spent} 元，還剩多少元？`, budget - spent, `${budget} - ${spent} = ?`, id, tag)
    }
  }
}

function g2Twostep(easy: boolean): Problem {
  const id = 'g2-twostep', tag = 'N-2-8'
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(10, easy ? 30 : 50), b = rand(5, easy ? 15 : 30), c = rand(5, easy ? 15 : 20)
      return p(`有 ${a} 個，拿走 ${b} 個又加入 ${c} 個，還有幾個？`, a - b + c, '先減再加。', id, tag)
    }
    case 1: {
      const a = rand(2, easy ? 4 : 6), b = rand(2, easy ? 5 : 9), c = rand(5, easy ? 10 : 20)
      return p(`每盒 ${b} 個，買了 ${a} 盒，再多買 ${c} 個，共幾個？`, a * b + c, '先乘再加。', id, tag)
    }
    default: {
      const a = rand(2, easy ? 3 : 5), b = rand(2, easy ? 5 : 9), c = rand(1, a * b - 1)
      return p(`每包 ${b} 個，買了 ${a} 包，吃了 ${c} 個，剩幾個？`, a * b - c, '先算總共幾個再減。', id, tag)
    }
  }
}

function g2Divide(easy: boolean): Problem {
  const id = 'g2-divide', tag = 'N-2-9'
  const mx = easy ? 5 : 9
  switch (rand(0, 2)) {
    case 0: {
      const b = rand(2, mx), ans = rand(2, mx)
      return p(`${b * ans} 個分給 ${b} 人，每人幾個？`, ans, '想想幾乘幾等於 ' + (b * ans) + '。', id, tag)
    }
    case 1: {
      const b = rand(2, mx), ans = rand(2, mx)
      return p(`${b * ans} 個，每 ${b} 個裝一袋，可以裝幾袋？`, ans, '用除法想想看。', id, tag)
    }
    default: {
      const b = rand(2, mx), ans = rand(2, mx)
      return p(`${b * ans} 個平分成 ${b} 份，每份幾個？`, ans, '總數除以份數。', id, tag)
    }
  }
}

// --- 三年級 ---

function g3Multiply(easy: boolean): Problem {
  const id = 'g3-multiply', tag = 'N-3-3'
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(easy ? 11 : 20, easy ? 50 : 99), b = rand(2, easy ? 5 : 9)
      return p(`${a} × ${b} = ?`, a * b, '十位和個位分開乘再加起來。', id, tag)
    }
    case 1: {
      const a = rand(easy ? 100 : 100, easy ? 200 : 500), b = rand(2, easy ? 4 : 9)
      return p(`${a} × ${b} = ?`, a * b, '百位、十位、個位分開算。', id, tag)
    }
    default: {
      const price = rand(easy ? 10 : 20, easy ? 50 : 99), qty = rand(2, easy ? 4 : 8)
      return p(`每本 ${price} 元，買 ${qty} 本，要付多少元？`, price * qty, '單價 × 數量。', id, tag)
    }
  }
}

function g3Divide(easy: boolean): Problem {
  const id = 'g3-divide', tag = 'N-3-4'
  switch (rand(0, 2)) {
    case 0: {
      const b = rand(2, easy ? 5 : 9), ans = rand(easy ? 3 : 10, easy ? 20 : 99)
      return p(`${b * ans} ÷ ${b} = ?`, ans, '用乘法回推。', id, tag)
    }
    case 1: {
      const b = rand(2, easy ? 5 : 9), ans = rand(2, easy ? 10 : 30), rem = rand(1, b - 1)
      const total = b * ans + rem
      return p(`${total} ÷ ${b} = ? ... ${rem}，商是多少？`, ans, '先想最大的能整除的數。', id, tag)
    }
    default: {
      const people = rand(2, easy ? 5 : 8), each = rand(3, easy ? 10 : 20)
      return p(`${people * each} 個平分給 ${people} 人，每人幾個？`, each, '總數 ÷ 人數。', id, tag)
    }
  }
}

function g3Fraction(easy: boolean): Problem {
  const id = 'g3-fraction', tag = 'N-3-9'
  const den = easy ? pick([4, 5]) : pick([5, 8, 10])
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(1, den - 2), b = rand(1, den - a)
      return p(`${a}/${den} + ${b}/${den} = ?/${den}，分子是多少？`, a + b, '同分母分數，分子直接加。', id, tag)
    }
    case 1: {
      const a = rand(2, den - 1), b = rand(1, a - 1)
      return p(`${a}/${den} - ${b}/${den} = ?/${den}，分子是多少？`, a - b, '同分母分數，分子直接減。', id, tag)
    }
    default: {
      const n = rand(1, den)
      return p(`一條繩子分成 ${den} 段，取 ${n} 段是全部的幾分之幾？（輸入分子）`, n, `分母是 ${den}，分子就是取了幾段。`, id, tag)
    }
  }
}

function g3Decimal(easy: boolean): Problem {
  const id = 'g3-decimal', tag = 'N-3-10'
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(1, easy ? 5 : 9), b = rand(1, easy ? 5 : 9)
      return p(`0.${a} + 0.${b} = ?（小數一位）`, r1((a + b) / 10), '小數點對齊再加。', id, tag)
    }
    case 1: {
      const a = rand(easy ? 5 : 3, 9), b = rand(1, a - 1)
      return p(`0.${a} - 0.${b} = ?（小數一位）`, r1((a - b) / 10), '小數點對齊再減。', id, tag)
    }
    default: {
      const whole = rand(1, easy ? 5 : 15), dec = rand(1, 9)
      const w2 = rand(1, easy ? 5 : 10), d2 = rand(1, 9)
      const ans = r1(whole + dec / 10 + w2 + d2 / 10)
      return p(`${whole}.${dec} + ${w2}.${d2} = ?（小數一位）`, ans, '整數和小數分開加。', id, tag)
    }
  }
}

function g3Twostep(easy: boolean): Problem {
  const id = 'g3-twostep', tag = 'N-3-7'
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(easy ? 10 : 20, easy ? 30 : 60), b = rand(2, easy ? 5 : 9), c = rand(2, easy ? 5 : 9)
      return p(`${a} + ${b} × ${c} = ?`, a + b * c, '先算乘法再加。', id, tag)
    }
    case 1: {
      const a = rand(2, easy ? 4 : 6), b = rand(2, easy ? 5 : 9), c = rand(2, easy ? 4 : 6), d = rand(2, easy ? 5 : 9)
      return p(`${a} × ${b} + ${c} × ${d} = ?`, a * b + c * d, '先算兩個乘法再相加。', id, tag)
    }
    default: {
      const a = rand(2, easy ? 4 : 6), b = rand(2, easy ? 5 : 9), c = rand(2, a * b - 1)
      return p(`${a} × ${b} - ${c} = ?`, a * b - c, '先算乘法再減。', id, tag)
    }
  }
}

// --- 四年級 ---

function g4Muldiv(easy: boolean): Problem {
  const id = 'g4-muldiv', tag = 'N-4-2'
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(easy ? 10 : 20, easy ? 50 : 99), b = rand(easy ? 2 : 10, easy ? 9 : 50)
      return p(`${a} × ${b} = ?`, a * b, '用直式計算。', id, tag)
    }
    case 1: {
      const b = rand(easy ? 2 : 5, easy ? 9 : 30), ans = rand(easy ? 3 : 10, easy ? 30 : 99)
      return p(`${b * ans} ÷ ${b} = ?`, ans, '估商後逐步驗算。', id, tag)
    }
    default: {
      const price = rand(easy ? 20 : 50, easy ? 99 : 200), boxes = rand(easy ? 3 : 10, easy ? 10 : 30)
      return p(`一箱 ${price} 元，買 ${boxes} 箱要多少元？`, price * boxes, '單價 × 數量。', id, tag)
    }
  }
}

function g4Fraction(easy: boolean): Problem {
  const id = 'g4-fraction', tag = 'N-4-5'
  const den = easy ? pick([4, 5, 6]) : pick([6, 7, 8, 9])
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(1, den + 2), b = rand(1, den)
      return p(`${a}/${den} + ${b}/${den} = ?/${den}，分子是多少？`, a + b, '同分母，分子直接加。', id, tag)
    }
    case 1: {
      const whole = rand(1, 3), num = rand(1, den - 1)
      return p(`${whole} 又 ${num}/${den} 化成假分數 = ?/${den}，分子是多少？`, whole * den + num, '整數部分 × 分母 + 分子。', id, tag)
    }
    default: {
      const a = rand(1, den - 1), k = rand(2, easy ? 3 : 5)
      return p(`${a}/${den} × ${k} = ?/${den}，分子是多少？`, a * k, '分子乘以整數，分母不變。', id, tag)
    }
  }
}

function g4Decimal(easy: boolean): Problem {
  const id = 'g4-decimal', tag = 'N-4-7'
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(easy ? 10 : 10, easy ? 50 : 99) / 100, b = rand(10, 99) / 100
      return p(`${a.toFixed(2)} + ${b.toFixed(2)} = ?`, r1(a + b), '小數點對齊加。', id, tag)
    }
    case 1: {
      const a = rand(50, 99) / 100, b = rand(10, Math.floor(a * 100) - 1) / 100
      return p(`${a.toFixed(2)} - ${b.toFixed(2)} = ?`, r1(a - b), '小數點對齊減。', id, tag)
    }
    default: {
      const a = rand(easy ? 10 : 10, easy ? 30 : 50) / 10, k = rand(2, easy ? 4 : 8)
      return p(`${a.toFixed(1)} × ${k} = ?（小數一位）`, r1(a * k), '先當整數乘再補小數點。', id, tag)
    }
  }
}

function g4Area(easy: boolean): Problem {
  const id = 'g4-area', tag = 'S-4-3'
  switch (rand(0, 3)) {
    case 0: {
      const l = rand(easy ? 2 : 3, easy ? 10 : 20), w = rand(2, easy ? 8 : 15)
      return p(`長方形長 ${l}、寬 ${w}，面積 = ?`, l * w, '面積 = 長 × 寬。', id, tag)
    }
    case 1: {
      const l = rand(easy ? 2 : 3, easy ? 10 : 15), w = rand(2, easy ? 8 : 12)
      return p(`長方形長 ${l}、寬 ${w}，周長 = ?`, (l + w) * 2, '周長 = (長 + 寬) × 2。', id, tag)
    }
    case 2: {
      const s = rand(2, easy ? 8 : 15)
      return p(`正方形邊長 ${s}，面積 = ?`, s * s, '正方形面積 = 邊長 × 邊長。', id, tag)
    }
    default: {
      const area = pick(easy ? [12, 20, 24, 30] : [36, 48, 60, 72]), l = pick([3, 4, 5, 6].filter(d => area % d === 0))
      return p(`長方形面積 ${area}，長 ${l}，寬 = ?`, area / l, '寬 = 面積 ÷ 長。', id, tag)
    }
  }
}

function g4Estimate(easy: boolean): Problem {
  const id = 'g4-estimate', tag = 'N-4-4'
  switch (rand(0, 2)) {
    case 0: {
      const n = rand(easy ? 15 : 100, easy ? 95 : 999)
      const rounded = Math.round(n / 10) * 10
      return p(`${n} 四捨五入到十位 = ?`, rounded, '看個位數字，5以上進位。', id, tag)
    }
    case 1: {
      const n = rand(easy ? 100 : 500, easy ? 999 : 9999)
      const rounded = Math.round(n / 100) * 100
      return p(`${n} 四捨五入到百位 = ?`, rounded, '看十位數字決定進捨。', id, tag)
    }
    default: {
      const a = rand(easy ? 10 : 30, easy ? 50 : 99), b = rand(easy ? 10 : 30, easy ? 50 : 99)
      const approx = Math.round(a / 10) * 10 + Math.round(b / 10) * 10
      return p(`${a} + ${b} 大約是多少？（各取到十位再加）`, approx, '先四捨五入再計算。', id, tag)
    }
  }
}

// --- 五年級 ---

function g5Fraction(easy: boolean): Problem {
  const id = 'g5-fraction', tag = 'N-5-4'
  // 異分母限一分母為另一分母的倍數，或容易通分的情況
  switch (rand(0, 2)) {
    case 0: {
      // 一分母為另一倍數：如 1/3 + 1/6
      const small = pick(easy ? [2, 3] : [3, 4, 5])
      const k = pick([2, 3])
      const big = small * k
      const a = rand(1, small - 1), b = rand(1, big - 1)
      const ans = a * k + b // 通分後的分子，分母是 big
      return p(`${a}/${small} + ${b}/${big} = ?/${big}，分子是多少？`, ans, `先把 ${a}/${small} 通分成 ?/${big}。`, id, tag)
    }
    case 1: {
      const small = pick(easy ? [2, 3] : [3, 4, 5])
      const k = pick([2, 3])
      const big = small * k
      const b = rand(1, big - 2), a = rand(1, small - 1)
      const ans = a * k - b
      if (ans <= 0) return g5Fraction(easy)
      return p(`${a}/${small} - ${b}/${big} = ?/${big}，分子是多少？`, ans, `先通分再減。`, id, tag)
    }
    default: {
      const den = pick(easy ? [6, 8] : [12, 15, 18])
      const a = rand(2, den / 2)
      const gcd = [2, 3, 4, 5, 6].find(d => a % d === 0 && den % d === 0) ?? 1
      return p(`${a}/${den} 約分後分子是多少？`, a / gcd, `找到 ${a} 和 ${den} 的公因數來約分。`, id, tag)
    }
  }
}

function g5Fracmul(easy: boolean): Problem {
  const id = 'g5-fracmul', tag = 'N-5-5'
  switch (rand(0, 2)) {
    case 0: {
      const n = rand(2, easy ? 5 : 10), den = pick(easy ? [3, 4, 5] : [4, 5, 6, 8]), num = rand(1, den - 1)
      const ans = n * num // 答案：分子（分母是 den）
      return p(`${n} × ${num}/${den} = ?/${den}，分子是多少？`, ans, '整數乘以分子。', id, tag)
    }
    case 1: {
      const d1 = pick(easy ? [2, 3] : [3, 4, 5]), d2 = pick(easy ? [2, 3] : [3, 4, 5])
      const n1 = rand(1, d1 - 1), n2 = rand(1, d2 - 1)
      const ansNum = n1 * n2, ansDen = d1 * d2
      return p(`${n1}/${d1} × ${n2}/${d2} = ?/${ansDen}，分子是多少？`, ansNum, '分子乘分子，分母乘分母。', id, tag)
    }
    default: {
      const total = rand(easy ? 10 : 20, easy ? 30 : 60), den = pick([2, 4, 5])
      const ans = total / den
      return p(`${total} 的 1/${den} 是多少？`, ans, `${total} ÷ ${den}。`, id, tag)
    }
  }
}

function g5Decimal(easy: boolean): Problem {
  const id = 'g5-decimal', tag = 'N-5-8'
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(easy ? 10 : 20, easy ? 50 : 80) / 10, b = rand(2, easy ? 5 : 9)
      return p(`${a.toFixed(1)} × ${b} = ?（小數一位）`, r1(a * b), '先當整數乘再補小數點。', id, tag)
    }
    case 1: {
      const a = rand(easy ? 10 : 10, easy ? 30 : 50) / 10, b = rand(10, easy ? 30 : 50) / 10
      return p(`${a.toFixed(1)} × ${b.toFixed(1)} = ?`, r1(a * b), '先算整數部分，注意小數位數。', id, tag)
    }
    default: {
      const b = rand(2, easy ? 5 : 8), ans = rand(easy ? 10 : 10, easy ? 50 : 99) / 10
      const total = r1(ans * b)
      return p(`${total} ÷ ${b} = ?（小數一位）`, r1(ans), '用直式除法。', id, tag)
    }
  }
}

function g5Percent(easy: boolean): Problem {
  const id = 'g5-percent', tag = 'N-5-10'
  switch (rand(0, 2)) {
    case 0: {
      const base = easy ? pick([100, 200, 500]) : rand(100, 500)
      const pct = easy ? pick([10, 25, 50]) : pick([10, 20, 25, 30, 40, 50, 75])
      return p(`${base} 的 ${pct}% 是多少？`, r1(base * pct / 100), `${base} × ${pct} ÷ 100。`, id, tag)
    }
    case 1: {
      const base = easy ? pick([100, 200]) : rand(100, 400)
      const discount = easy ? pick([5, 8]) : pick([6, 7, 8, 9])
      const ans = r1(base * discount / 10)
      return p(`${base} 元打 ${discount} 折是多少元？`, ans, `${discount} 折就是乘以 0.${discount}。`, id, tag)
    }
    default: {
      const whole = easy ? 100 : pick([100, 200, 500])
      const part = rand(10, whole - 10)
      const pct = Math.round(part / whole * 100)
      return p(`${part} 是 ${whole} 的百分之幾？`, pct, `${part} ÷ ${whole} × 100。`, id, tag)
    }
  }
}

function g5Volume(easy: boolean): Problem {
  const id = 'g5-volume', tag = 'S-5-5'
  switch (rand(0, 2)) {
    case 0: {
      const l = rand(2, easy ? 6 : 10), w = rand(2, easy ? 6 : 10), h = rand(2, easy ? 6 : 10)
      return p(`長方體 ${l}×${w}×${h}，體積 = ?`, l * w * h, '體積 = 長 × 寬 × 高。', id, tag)
    }
    case 1: {
      const s = rand(2, easy ? 6 : 10)
      return p(`正方體邊長 ${s}，體積 = ?`, s * s * s, '體積 = 邊長 × 邊長 × 邊長。', id, tag)
    }
    default: {
      const l = rand(2, easy ? 5 : 8), w = rand(2, easy ? 5 : 8), h = rand(2, easy ? 5 : 8)
      const vol = l * w * h
      return p(`長方體體積 ${vol}，長 ${l}、寬 ${w}，高 = ?`, h, `高 = ${vol} ÷ ${l} ÷ ${w}。`, id, tag)
    }
  }
}

// --- 六年級 ---

function g6Fracdiv(easy: boolean): Problem {
  const id = 'g6-fracdiv', tag = 'N-6-3'
  switch (rand(0, 2)) {
    case 0: {
      const den = pick(easy ? [2, 3, 4] : [3, 4, 5, 6]), num = rand(1, den * 2), div = rand(2, easy ? 3 : 5)
      // num/den ÷ div = num/(den*div) → 分子 num, 分母 den*div
      return p(`${num}/${den} ÷ ${div} = ?/${den * div}，分子是多少？`, num, '除以整數：分母乘以除數。', id, tag)
    }
    case 1: {
      const n = rand(2, easy ? 6 : 12), den = pick(easy ? [2, 3] : [3, 4, 5])
      const num = rand(1, den - 1)
      const ans = n * den // n ÷ num/den = n × den/num，取分子
      return p(`${n} ÷ ${num}/${den} = ?（整數）`, Math.round(n / (num / den)), '除以分數＝乘以倒數。', id, tag)
    }
    default: {
      const d = pick(easy ? [2, 3] : [3, 4, 5])
      const a = rand(1, d * 2), b = rand(1, d)
      // a/d ÷ b/d = a/b → 簡化為整數
      if (a % b !== 0) return g6Fracdiv(easy)
      return p(`${a}/${d} ÷ ${b}/${d} = ?`, a / b, '同分母相除，分子直接除。', id, tag)
    }
  }
}

function g6Decdiv(easy: boolean): Problem {
  const id = 'g6-decdiv', tag = 'N-6-4'
  switch (rand(0, 1)) {
    case 0: {
      const b = rand(2, easy ? 5 : 8)
      const ans = rand(easy ? 10 : 10, easy ? 50 : 99) / 10
      const total = r1(ans * b)
      return p(`${total} ÷ ${b} = ?（小數一位）`, r1(ans), '用直式除法計算。', id, tag)
    }
    default: {
      const b = rand(2, easy ? 5 : 9) / 10
      const ans = rand(2, easy ? 10 : 30)
      const total = r1(ans * b)
      return p(`${total} ÷ ${b.toFixed(1)} = ?`, ans, '先把除數化成整數。', id, tag)
    }
  }
}

function g6Ratio(easy: boolean): Problem {
  const id = 'g6-ratio', tag = 'N-6-6'
  switch (rand(0, 2)) {
    case 0: {
      const a = rand(2, easy ? 5 : 9), b = rand(2, easy ? 5 : 9), k = rand(2, easy ? 3 : 5)
      return p(`${a}:${b} = ${a * k}:?，? 是多少？`, b * k, '前後同乘。', id, tag)
    }
    case 1: {
      const a = rand(2, easy ? 6 : 12), b = rand(2, easy ? 6 : 12)
      const gcd = [2, 3, 4, 5, 6].reverse().find(d => a % d === 0 && b % d === 0) ?? 1
      return p(`${a}:${b} 最簡整數比的前項是？`, a / gcd, '找最大公因數化簡。', id, tag)
    }
    default: {
      const total = easy ? pick([20, 30, 40]) : pick([60, 80, 100])
      const a = rand(1, 4), b = rand(1, 4)
      const partA = Math.round(total * a / (a + b))
      return p(`${total} 個按 ${a}:${b} 分配，多的那份有幾個？`, Math.max(partA, total - partA), '先算總份數再分配。', id, tag)
    }
  }
}

function g6Speed(easy: boolean): Problem {
  const id = 'g6-speed', tag = 'N-6-7'
  switch (rand(0, 2)) {
    case 0: {
      const speed = rand(easy ? 3 : 30, easy ? 10 : 80), time = rand(2, easy ? 5 : 8)
      return p(`速度 ${speed} 公里/時，走 ${time} 小時，距離 = ?`, speed * time, '距離 = 速度 × 時間。', id, tag)
    }
    case 1: {
      const speed = rand(easy ? 3 : 30, easy ? 10 : 80), time = rand(2, easy ? 5 : 8)
      const dist = speed * time
      return p(`距離 ${dist} 公里，時間 ${time} 小時，速度 = ?`, speed, '速度 = 距離 ÷ 時間。', id, tag)
    }
    default: {
      const speed = rand(easy ? 3 : 20, easy ? 10 : 60), dist = speed * rand(2, easy ? 5 : 8)
      return p(`距離 ${dist} 公里，速度 ${speed} 公里/時，時間 = ?小時`, dist / speed, '時間 = 距離 ÷ 速度。', id, tag)
    }
  }
}

function g6Circle(easy: boolean): Problem {
  const id = 'g6-circle', tag = 'S-6-3'
  switch (rand(0, 2)) {
    case 0: {
      const r = rand(easy ? 2 : 3, easy ? 5 : 10)
      const area = r1(3.14 * r * r)
      return p(`圓半徑 ${r}，面積 = ?（π 取 3.14）`, area, '面積 = 3.14 × 半徑 × 半徑。', id, tag)
    }
    case 1: {
      const r = rand(easy ? 2 : 3, easy ? 5 : 10)
      const circ = r1(2 * 3.14 * r)
      return p(`圓半徑 ${r}，周長 = ?（π 取 3.14）`, circ, '周長 = 2 × 3.14 × 半徑。', id, tag)
    }
    default: {
      const d = rand(easy ? 4 : 6, easy ? 10 : 20)
      const circ = r1(3.14 * d)
      return p(`圓直徑 ${d}，周長 = ?（π 取 3.14）`, circ, '周長 = 3.14 × 直徑。', id, tag)
    }
  }
}

// ─── 生成器註冊表 ───

const REGISTRY: Record<string, Gen> = {
  'g1-addsub': g1Addsub, 'g1-number': g1Number, 'g1-money': g1Money, 'g1-compare': g1Compare,
  'g2-addsub': g2Addsub, 'g2-multiply': g2Multiply, 'g2-money': g2Money, 'g2-twostep': g2Twostep, 'g2-divide': g2Divide,
  'g3-multiply': g3Multiply, 'g3-divide': g3Divide, 'g3-fraction': g3Fraction, 'g3-decimal': g3Decimal, 'g3-twostep': g3Twostep,
  'g4-muldiv': g4Muldiv, 'g4-fraction': g4Fraction, 'g4-decimal': g4Decimal, 'g4-area': g4Area, 'g4-estimate': g4Estimate,
  'g5-fraction': g5Fraction, 'g5-fracmul': g5Fracmul, 'g5-decimal': g5Decimal, 'g5-percent': g5Percent, 'g5-volume': g5Volume,
  'g6-fracdiv': g6Fracdiv, 'g6-decdiv': g6Decdiv, 'g6-ratio': g6Ratio, 'g6-speed': g6Speed, 'g6-circle': g6Circle,
}

// ─── 公開 API ───

export function generateProblem(unitId: string, easy: boolean = false): Problem {
  const gen = REGISTRY[unitId]
  if (gen) return gen(easy)
  // fallback
  const a = rand(1, 10), b = rand(1, 10)
  return { text: `${a} + ${b} = ?`, answer: a + b, hint: '兩個相加。', unitId, curriculumTag: 'N-1-3' }
}

export function getCurriculumTag(unitId: string): string {
  for (const g of [1, 2, 3, 4, 5, 6] as Grade[]) {
    const found = GRADE_UNITS[g].find((u) => u.id === unitId)
    if (found) return found.curriculumTag
  }
  return 'N-0-0'
}

export function buildOptions(answer: number, grade: Grade): number[] {
  const isDecimal = !Number.isInteger(answer)
  const deltaPool = grade <= 2
    ? [1, 2, 3, 5, 10]
    : grade <= 4
      ? [1, 2, 3, 4, 6, 8, 10]
      : isDecimal
        ? [0.1, 0.2, 0.3, 0.5, 1, 2, 5]
        : [1, 2, 3, 5, 8, 10, 15]

  const options = new Set<number>([answer])
  let attempts = 0
  while (options.size < 4 && attempts < 50) {
    attempts++
    const delta = deltaPool[rand(0, deltaPool.length - 1)]
    const sign = Math.random() < 0.5 ? -1 : 1
    const candidate = Number((answer + sign * delta).toFixed(1))
    if (candidate !== answer && candidate >= 0) options.add(candidate)
  }
  // 如果沒湊滿就用簡單偏移填充
  while (options.size < 4) {
    options.add(answer + options.size)
  }
  return Array.from(options).sort(() => Math.random() - 0.5)
}
