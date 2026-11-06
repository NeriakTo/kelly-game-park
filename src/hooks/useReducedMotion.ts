import { useEffect, useState } from 'react'

// 系統設定了「減少動態效果」嗎？（iPad：設定 → 輔助使用 → 動態效果 → 減少動態效果）
// CSS 那邊另有全站的 @media 規則把轉場與動畫關掉；這個 hook 給要在程式裡決定「要不要放動畫 class」的元件用。

const QUERY = '(prefers-reduced-motion: reduce)'

function current(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(current)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(QUERY)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduce
}
