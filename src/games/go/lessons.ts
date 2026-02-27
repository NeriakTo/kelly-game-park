import type { Position, StoneColor } from './types'

export interface LessonStep {
  readonly instruction: string
  readonly hint?: string
}

export interface Lesson {
  readonly id: string
  readonly title: string
  readonly concept: string
  readonly description: string
  readonly boardSize: number
  readonly setup: readonly { pos: Position; color: StoneColor }[]
  readonly steps: readonly LessonStep[]
  readonly targetMoves: readonly (Position | null)[] // 逐步對應：Position = 需落子，null = 觀察步驟（可直接繼續）
}

export const LESSONS: readonly Lesson[] = [
  // ─── 第 1 課：放棋子 ───
  {
    id: 'lesson-1',
    title: '放棋子',
    concept: '下在交叉點、黑白輪流',
    description: '圍棋的棋子要放在格線的交叉點上，黑棋先下，然後白棋，輪流來！',
    boardSize: 9,
    setup: [],
    steps: [
      { instruction: '圍棋的棋子放在格線的交叉點上，不是格子裡面喔！試試看，在棋盤上任意一個位置放一顆黑棋。' },
      { instruction: '很好！現在換白棋了。在另一個位置放一顆白棋。' },
      { instruction: '再放一顆黑棋吧！你已經學會輪流下棋了！', hint: '棋子一旦放下就不能移動喔！' },
    ],
    targetMoves: [null, null, null], // 3 步都是自由放置
  },

  // ─── 第 2 課：氣 ───
  {
    id: 'lesson-2',
    title: '氣',
    concept: '棋子需要呼吸空間',
    description: '每顆棋子旁邊空的交叉點叫做「氣」。棋子需要氣才能活著！',
    boardSize: 9,
    setup: [
      { pos: [4, 4], color: 'black' },
    ],
    steps: [
      { instruction: '中間的黑棋有 4 口氣（上下左右）。看看棋盤上標記的氣！', hint: '上下左右四個空點就是 4 口氣' },
      { instruction: '如果白棋下在黑棋旁邊，黑棋的氣就少了。請在黑棋上方放一顆白棋。', hint: '點黑棋正上方的位置' },
      { instruction: '現在黑棋只剩 3 口氣了。記住：被堵住的方向就不算氣！' },
    ],
    targetMoves: [null, [3, 4], null], // step 0 觀察，step 1 落子，step 2 觀察
  },

  // ─── 第 3 課：提子 ───
  {
    id: 'lesson-3',
    title: '提子',
    concept: '堵住所有氣就能吃掉',
    description: '把對方棋子的氣全部堵住，就可以把它吃掉（提掉）！',
    boardSize: 9,
    setup: [
      { pos: [4, 4], color: 'white' },
      { pos: [3, 4], color: 'black' },
      { pos: [5, 4], color: 'black' },
      { pos: [4, 3], color: 'black' },
    ],
    steps: [
      { instruction: '白棋只剩 1 口氣了！你看到了嗎？就是右邊那個空位。' },
      { instruction: '請在白棋右邊下一顆黑棋，把白棋的最後一口氣堵住！', hint: '點白棋右邊的交叉點' },
      { instruction: '太棒了！白棋沒有氣了，被吃掉（提走）了！這就叫做「提子」。' },
    ],
    targetMoves: [null, [4, 5], null], // step 0 觀察，step 1 提子，step 2 觀察
  },

  // ─── 第 4 課：連接 ───
  {
    id: 'lesson-4',
    title: '連接',
    concept: '相連的棋共用氣',
    description: '上下左右相鄰的同色棋子會連成一組，共享所有的氣！',
    boardSize: 9,
    setup: [
      { pos: [4, 3], color: 'black' },
      { pos: [4, 5], color: 'black' },
    ],
    steps: [
      { instruction: '棋盤上有兩顆黑棋，但它們中間隔了一格。它們各自有自己的氣。' },
      { instruction: '請在它們中間下一顆黑棋，把它們連起來！', hint: '點兩顆黑棋中間的位置' },
      { instruction: '連起來了！現在三顆棋子變成一組，共享所有的氣，更難被吃掉了！' },
    ],
    targetMoves: [null, [4, 4], null], // step 0 觀察，step 1 連接，step 2 觀察
  },

  // ─── 第 5 課：禁著點 ───
  {
    id: 'lesson-5',
    title: '禁著點',
    concept: '不能自殺的位置',
    description: '不能把自己的棋子下在沒有氣的地方（除非能吃掉對方）。',
    boardSize: 9,
    setup: [
      { pos: [3, 4], color: 'white' },
      { pos: [5, 4], color: 'white' },
      { pos: [4, 3], color: 'white' },
      { pos: [4, 5], color: 'white' },
    ],
    steps: [
      { instruction: '看看中間的位置 — 白棋把它四面圍住了。如果黑棋下在那裡，會完全沒有氣！' },
      { instruction: '標記 ❌ 的位置就是「禁著點」，黑棋不能下在那裡。試試看在其他地方下棋。', hint: '在沒有 ❌ 標記的位置下棋' },
      { instruction: '很好！記住：不能把自己的棋子下在完全沒有氣的地方（自殺），除非下了之後能吃掉對方的棋。' },
    ],
    targetMoves: [null, null, null],
  },

  // ─── 第 6 課：打劫 ───
  {
    id: 'lesson-6',
    title: '打劫',
    concept: '不能馬上吃回來',
    description: '如果互相吃來吃去會沒完沒了，所以規定不能「馬上」吃回來！',
    boardSize: 9,
    setup: [
      { pos: [3, 3], color: 'black' },
      { pos: [3, 5], color: 'black' },
      { pos: [4, 4], color: 'black' },
      { pos: [2, 4], color: 'black' },
      { pos: [3, 4], color: 'white' },
      { pos: [4, 3], color: 'white' },
      { pos: [4, 5], color: 'white' },
      { pos: [5, 4], color: 'white' },
      { pos: [2, 3], color: 'white' },
    ],
    steps: [
      { instruction: '這是一個「打劫」的形狀。注意看黑棋和白棋互相只差一口氣。' },
      { instruction: '如果一方吃了對方，對方不能馬上吃回來，要先在別的地方下一手。' },
      { instruction: '這就是「打劫」規則，防止棋局無限循環！' },
    ],
    targetMoves: [null, null, null],
  },

  // ─── 第 7 課：兩眼活棋 ───
  {
    id: 'lesson-7',
    title: '兩眼活棋',
    concept: '有兩個眼就抓不死',
    description: '如果一組棋子裡面有兩個「眼」（空的交叉點），對方永遠無法吃掉它！',
    boardSize: 9,
    setup: [
      // 有兩眼的黑棋組
      { pos: [2, 2], color: 'black' },
      { pos: [2, 3], color: 'black' },
      { pos: [2, 4], color: 'black' },
      { pos: [2, 5], color: 'black' },
      { pos: [3, 2], color: 'black' },
      { pos: [3, 5], color: 'black' },
      { pos: [4, 2], color: 'black' },
      { pos: [4, 3], color: 'black' },
      { pos: [4, 4], color: 'black' },
      { pos: [4, 5], color: 'black' },
      // 白棋包圍
      { pos: [1, 2], color: 'white' },
      { pos: [1, 3], color: 'white' },
      { pos: [1, 4], color: 'white' },
      { pos: [1, 5], color: 'white' },
      { pos: [5, 2], color: 'white' },
      { pos: [5, 3], color: 'white' },
      { pos: [5, 4], color: 'white' },
      { pos: [5, 5], color: 'white' },
      { pos: [2, 1], color: 'white' },
      { pos: [3, 1], color: 'white' },
      { pos: [4, 1], color: 'white' },
      { pos: [2, 6], color: 'white' },
      { pos: [3, 6], color: 'white' },
      { pos: [4, 6], color: 'white' },
    ],
    steps: [
      { instruction: '黑棋圍出了兩個「眼」：(3,3) 和 (3,4) 這兩個空點。' },
      { instruction: '白棋如果下在其中一個眼裡，自己反而沒有氣！所以兩個眼的棋組永遠抓不死。' },
      { instruction: '記住口訣：「兩眼活棋」— 有兩個眼的棋組是安全的！' },
    ],
    targetMoves: [null, null, null],
  },

  // ─── 第 8 課：數地 ───
  {
    id: 'lesson-8',
    title: '數地',
    concept: '數誰圍的地多就贏',
    description: '遊戲結束時，數一數誰的棋子加上圍住的空地比較多，多的那方就贏了！',
    boardSize: 9,
    setup: [
      // 黑棋領地（左半）
      { pos: [0, 4], color: 'black' },
      { pos: [1, 4], color: 'black' },
      { pos: [2, 4], color: 'black' },
      { pos: [3, 4], color: 'black' },
      { pos: [4, 4], color: 'black' },
      { pos: [5, 4], color: 'black' },
      { pos: [6, 4], color: 'black' },
      { pos: [7, 4], color: 'black' },
      { pos: [8, 4], color: 'black' },
      // 白棋領地（右半）
      { pos: [0, 5], color: 'white' },
      { pos: [1, 5], color: 'white' },
      { pos: [2, 5], color: 'white' },
      { pos: [3, 5], color: 'white' },
      { pos: [4, 5], color: 'white' },
      { pos: [5, 5], color: 'white' },
      { pos: [6, 5], color: 'white' },
      { pos: [7, 5], color: 'white' },
      { pos: [8, 5], color: 'white' },
    ],
    steps: [
      { instruction: '遊戲結束了！現在來數地。黑棋（左邊）和白棋（右邊）各圍了多少地？' },
      { instruction: '黑棋的棋子 + 圍住的空地 = 黑棋的分數。白棋也一樣。' },
      { instruction: '分數多的那方就贏了！中國規則還會加上棋盤上的活棋子數喔。' },
    ],
    targetMoves: [null, null, null],
  },
] as const
