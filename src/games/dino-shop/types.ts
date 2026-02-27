import type { Difficulty } from '../../types'

export type CoinValue = 1 | 5 | 10 | 50 | 100 | 500
export type StageId = 'A' | 'B' | 'C'

export type QuestionType =
  | 'recognize-coins'    // A-1: 認識硬幣，湊出指定金額
  | 'exact-payment'      // B-1: 單品付款，點硬幣付正確金額
  | 'calculate-change'   // C-1: 找零
  | 'multiple-items'     // A-2: 多品合計
  | 'budget-check'       // B-2: 預算管理
  | 'compare-prices'     // C-2: 比價
  | 'discount'           // A-3: 打折
  | 'multi-step'         // B-3: 多步驟
  | 'timed-shopping'     // C-3: 限時連續答題

export interface ShopItem {
  readonly id: string
  readonly name: string
  readonly emoji: string
  readonly price: number
  readonly category: 'egg' | 'fossil' | 'tool' | 'model' | 'food'
}

export interface ShopQuestion {
  readonly type: QuestionType
  readonly description: string
  readonly items: readonly ShopItem[]
  readonly targetAmount?: number
  readonly budget?: number
  readonly options?: readonly number[]
  readonly hint: string
  readonly answer: number
  readonly coinPayment?: boolean // true = 需要用硬幣面板付款
}

export interface DinoFossil {
  readonly dinoId: string
  readonly dinoName: string
  readonly dinoEmoji: string
  readonly totalPieces: number
  readonly collectedPieces: number
}

export interface DinoCollectionData {
  readonly fossils: readonly DinoFossil[]
  readonly totalCorrect: number
  readonly stageProgress: Record<string, number>
}

export interface StageConfig {
  readonly id: StageId
  readonly name: string
  readonly description: string
  readonly emoji: string
}

export const STAGES: readonly StageConfig[] = [
  { id: 'A', name: '認識硬幣', description: '學習硬幣面值', emoji: '🪙' },
  { id: 'B', name: '付款練習', description: '用硬幣付正確金額', emoji: '💰' },
  { id: 'C', name: '找零計算', description: '算算要找多少錢', emoji: '🧮' },
] as const

export const COIN_VALUES: readonly CoinValue[] = [1, 5, 10, 50, 100, 500] as const

export const COIN_COLORS: Record<CoinValue, { bg: string; text: string; border: string }> = {
  1: { bg: '#C0C0C0', text: '#333', border: '#999' },
  5: { bg: '#C0C0C0', text: '#333', border: '#999' },
  10: { bg: '#FFD700', text: '#8B6914', border: '#DAA520' },
  50: { bg: '#FFD700', text: '#8B6914', border: '#DAA520' },
  100: { bg: '#FFD700', text: '#8B6914', border: '#DAA520' },
  500: { bg: '#90EE90', text: '#2E7D32', border: '#4CAF50' },
}

export const DINO_COLLECTION: readonly { id: string; name: string; emoji: string }[] = [
  { id: 'trex', name: '暴龍', emoji: '🦖' },
  { id: 'bronto', name: '雷龍', emoji: '🦕' },
  { id: 'triceratops', name: '三角龍', emoji: '🦏' },
  { id: 'stego', name: '劍龍', emoji: '🐊' },
  { id: 'pterodactyl', name: '翼龍', emoji: '🦅' },
  { id: 'raptor', name: '迅猛龍', emoji: '🦎' },
] as const

export const COLLECTION_STORAGE_KEY = 'kelly-dino-collection'
export const PIECES_PER_DINO = 5
export const CORRECT_PER_PIECE = 3

/** 每個 stage×difficulty 對應多種題型，隨機選取避免重複 */
export function getQuestionTypeForStage(stage: StageId, difficulty: Difficulty): QuestionType {
  const pool: Record<string, readonly QuestionType[]> = {
    'A-1': ['recognize-coins', 'compare-prices'],
    'B-1': ['exact-payment', 'recognize-coins'],
    'C-1': ['calculate-change', 'exact-payment'],
    'A-2': ['multiple-items', 'compare-prices', 'budget-check'],
    'B-2': ['budget-check', 'multiple-items', 'calculate-change'],
    'C-2': ['compare-prices', 'calculate-change', 'multiple-items'],
    'A-3': ['discount', 'multi-step', 'budget-check'],
    'B-3': ['multi-step', 'discount', 'compare-prices'],
    'C-3': ['timed-shopping', 'multi-step', 'discount'],
  }
  const types = pool[`${stage}-${difficulty}`] ?? ['recognize-coins']
  return types[Math.floor(Math.random() * types.length)]
}
