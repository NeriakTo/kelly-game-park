import type { DinoCollectionData } from './types'
import { COLLECTION_STORAGE_KEY, DINO_COLLECTION, PIECES_PER_DINO } from './types'

// 恐龍商店的化石收藏（存在本機儲存）。商店寫入；首頁的收藏冊數量與收藏冊頁只讀出來顯示，
// 所以抽成獨立檔案，首頁不必載入整個商店遊戲。

export function loadCollection(): DinoCollectionData {
  try {
    const raw = localStorage.getItem(COLLECTION_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    fossils: DINO_COLLECTION.map((d) => ({
      dinoId: d.id,
      dinoName: d.name,
      dinoEmoji: d.emoji,
      totalPieces: PIECES_PER_DINO,
      collectedPieces: 0,
    })),
    totalCorrect: 0,
    stageProgress: {},
  }
}

export function saveCollection(data: DinoCollectionData): void {
  try {
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

/** 一共收集到幾片化石碎片 */
export function countFossilPieces(data: DinoCollectionData): number {
  return data.fossils.reduce((n, f) => n + Math.min(f.collectedPieces, f.totalPieces), 0)
}
