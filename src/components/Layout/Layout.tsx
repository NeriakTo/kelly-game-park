import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Grid3X3, Swords, Brain, Keyboard, Calculator, Settings } from 'lucide-react'
import DifficultySelector from '../UI/DifficultySelector'

const NAV_ITEMS = [
  { path: '', icon: Home, label: '首頁' },
  { path: 'sudoku', icon: Grid3X3, label: '數獨' },
  { path: 'chess', icon: Swords, label: '象棋' },
  { path: 'memory', icon: Brain, label: '翻牌' },
  { path: 'typing', icon: Keyboard, label: '打字' },
  { path: 'math', icon: Calculator, label: '數學' },
  { path: 'settings', icon: Settings, label: '設定' },
]

export default function Layout() {
  const location = useLocation()
  const current = location.pathname.replace(/^\//, '')
  const isGameRoute = ['sudoku', 'chess', 'memory', 'typing', 'math'].includes(current)

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-warm-bg">
      {/* Desktop: 左側功能列 + 右側內容 */}
      <div className="hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)] h-screen">
        <aside className="border-r border-mint/40 bg-white/65 backdrop-blur-sm p-4 flex flex-col">
          <Link to="/" className="text-warm-text font-bold text-xl mb-4">
            🎮 Kelly's Game Park
          </Link>

          <nav className="space-y-2">
            {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={`/${path}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  current === path
                    ? 'bg-mint/70 text-warm-text shadow-sm'
                    : 'text-warm-text/70 hover:bg-mint/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {isGameRoute && (
            <div className="mt-5 p-3 rounded-xl bg-sky-light/60">
              <p className="text-xs text-warm-text-light mb-2">🎚️ 難度切換</p>
              <DifficultySelector />
            </div>
          )}

          <div className="mt-4 p-3 rounded-xl bg-cream-light text-xs text-warm-text-light leading-relaxed">
            左側：功能選單＋難度
            <br />
            右側：最大化遊戲區
          </div>
        </aside>

        <main className="h-screen overflow-auto p-4 xl:p-5">
          <Outlet />
        </main>
      </div>

      {/* Mobile/Tablet: 保留原本上方導覽 */}
      <div className="lg:hidden min-h-screen flex flex-col">
        <header className="bg-mint/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-warm-text font-bold text-xl">
              🎮 Kelly's Game Park
            </Link>
            <nav className="hidden sm:flex gap-1">
              {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={`/${path}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    current === path
                      ? 'bg-white/70 text-warm-text shadow-sm'
                      : 'text-warm-text/70 hover:bg-white/40'
                  }`}
                >
                  <Icon className="inline w-4 h-4 mr-1" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full px-4 py-4">
          <Outlet />
        </main>

        <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm border-t border-mint/30 z-50">
          <div className="flex justify-around py-2">
            {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={`/${path}`}
                className={`flex flex-col items-center text-xs ${
                  current === path ? 'text-warm-text' : 'text-warm-text-light'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="sm:hidden h-16" />
      </div>
    </div>
  )
}
