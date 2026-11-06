import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'

// 遊戲頁依路由分開載入：首頁不必先下載全部遊戲，進到哪個遊戲才下載哪個。
// 每個遊戲有兩層網址：/<遊戲> 是選關畫面，/<遊戲>/<關卡>（easy、normal、hard）是遊戲本身。
// 載入中的畫面由 Layout 內包住頁面內容的 Suspense 負責。
const SudokuPage = lazy(() => import('./pages/SudokuPage'))
const ChessPage = lazy(() => import('./pages/ChessPage'))
const MemoryPage = lazy(() => import('./pages/MemoryPage'))
const TypingPage = lazy(() => import('./pages/TypingPage'))
const MathPage = lazy(() => import('./pages/MathPage'))
const DinoShopPage = lazy(() => import('./pages/DinoShopPage'))
const GoPage = lazy(() => import('./pages/GoPage'))
// 家長區也分開載入：裡面有 AI 連線與學習紀錄，孩子平常用不到
const ParentPage = lazy(() => import('./pages/parent/ParentPage'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="sudoku/:level?" element={<SudokuPage />} />
        <Route path="chess/:level?" element={<ChessPage />} />
        <Route path="memory/:level?" element={<MemoryPage />} />
        <Route path="typing/:level?" element={<TypingPage />} />
        <Route path="math/:level?" element={<MathPage />} />
        <Route path="dino-shop/:level?" element={<DinoShopPage />} />
        <Route path="go/:level?" element={<GoPage />} />
        <Route path="parent" element={<ParentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* 舊的設定頁網址導到家長區（一樣要先過家長驗證） */}
        <Route path="settings" element={<Navigate to="/parent" replace />} />
      </Route>
    </Routes>
  )
}
