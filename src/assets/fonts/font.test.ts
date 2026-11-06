import { describe, it, expect } from 'vitest'
import { collectSiteChars } from '../../../scripts/font/collect-chars.mjs'
import { readFontInfo } from '../../../scripts/font/woff2.mjs'

// 站內字型（jf open 粉圓 2.1 的子集，改名 YueyueRound）：
// 1. 站上會顯示的字都要在字型裡——新增畫面文字後沒重做子集，這條就會失敗（重做方式見 README.md）
// 2. 依 OFL，改過的字型不能沿用保留字型名稱；版權與授權說明要留在字型裡

// 原字型本來就沒有、交給系統字型的：emoji 與 emoji 變體選擇符，以及圍棋、數獨用的「✕」
const SYSTEM_FONT_ONLY = (ch: string) => /\p{Extended_Pictographic}/u.test(ch) || ch === '️' || ch === '✕'

describe('站內字型', () => {
  const font = readFontInfo()

  it('站上用到的字都在字型子集裡', () => {
    const missing = [...collectSiteChars()].filter((ch) => !SYSTEM_FONT_ONLY(ch) && !font.codePoints.has(ch.codePointAt(0)!))
    expect(missing.join('')).toBe('')
  })

  it('字型名稱改成 YueyueRound，不再用保留名稱（open huninn、huninn、Varela）', () => {
    const fontNames = font.names.filter((n) => [1, 3, 4, 6, 16].includes(n.nameID))
    expect(fontNames.length).toBeGreaterThan(0)
    for (const n of fontNames) {
      expect(n.value).toMatch(/^YueyueRound/)
      expect(n.value).not.toMatch(/huninn|粉圓|varela/i)
    }
  })

  it('版權與 OFL 授權說明留在字型裡', () => {
    const ids = new Set(font.names.map((n) => n.nameID))
    expect(ids.has(0)).toBe(true)
    expect(font.names.find((n) => n.nameID === 13)?.value).toMatch(/SIL Open Font License, Version 1\.1/)
    expect(font.names.find((n) => n.nameID === 14)?.value).toMatch(/OFL/)
  })
})
