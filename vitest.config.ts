import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 測試用設定：只掛 React 外掛，不載入 Tailwind（測試不處理樣式）
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
