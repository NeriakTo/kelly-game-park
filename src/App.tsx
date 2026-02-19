import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import SudokuPage from './pages/SudokuPage'
import ChessPage from './pages/ChessPage'
import MemoryPage from './pages/MemoryPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="sudoku" element={<SudokuPage />} />
        <Route path="chess" element={<ChessPage />} />
        <Route path="memory" element={<MemoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
