import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// 沒開 globals，Testing Library 不會自動清理，這裡手動清掉畫面與本機儲存
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
