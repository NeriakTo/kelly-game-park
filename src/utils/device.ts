// 判斷是不是「只有手指可用」的觸控裝置（例如沒接鍵盤的 iPad）。
// 瀏覽器沒辦法直接知道有沒有接實體鍵盤，所以看：有觸控點、主要指標是手指（pointer: coarse）、
// 而且沒有能停在畫面上的指標（hover: hover）。iPad 接了巧控鍵盤或觸控板時會回報 hover，這時就不算。
// 判斷不準時（例如接了藍牙鍵盤但沒有觸控板），打字的提示畫面按任何實體按鍵就會放行。

export function isTouchOnlyDevice(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  const touchPoints = window.navigator?.maxTouchPoints ?? 0
  if (touchPoints <= 0) return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const canHover = window.matchMedia('(hover: hover)').matches
  return coarse && !canHover
}
