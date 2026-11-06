import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import SettingsPage from './pages/SettingsPage'

// 遊戲頁依路由分開載入：首頁不必先下載全部遊戲，進到哪個遊戲才下載哪個。
// 載入中的畫面由 Layout 內包住頁面內容的 Suspense 負責。
const SudokuPage = lazy(() => import('./pages/SudokuPage'))
const ChessPage = lazy(() => import('./pages/ChessPage'))
const MemoryPage = lazy(() => import('./pages/MemoryPage'))
const TypingPage = lazy(() => import('./pages/TypingPage'))
const MathPage = lazy(() => import('./pages/MathPage'))
const DinoShopPage = lazy(() => import('./pages/DinoShopPage'))
const GoPage = lazy(() => import('./pages/GoPage'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="sudoku" element={<SudokuPage />} />
        <Route path="chess" element={<ChessPage />} />
        <Route path="memory" element={<MemoryPage />} />
        <Route path="typing" element={<TypingPage />} />
        <Route path="math" element={<MathPage />} />
        <Route path="dino-shop" element={<DinoShopPage />} />
        <Route path="go" element={<GoPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
