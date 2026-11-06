/** 站上用的字型檔路徑 */
export const SITE_FONT: string
export interface FontInfo {
  /** 字型有的字（Unicode 碼位） */
  codePoints: Set<number>
  /** 名稱表（Windows／Unicode 平台） */
  names: { nameID: number; value: string }[]
}
/** 讀 woff2 的 cmap 與 name 表 */
export function readFontInfo(file?: string): FontInfo
