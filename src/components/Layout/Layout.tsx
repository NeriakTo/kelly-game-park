import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Grid3X3, Swords, Brain, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { path: '', icon: Home, label: '首頁' },
  { path: 'sudoku', icon: Grid3X3, label: '數獨' },
  { path: 'chess', icon: Swords, label: '象棋' },
  { path: 'memory', icon: Brain, label: '翻牌' },
  { path: 'settings', icon: Settings, label: '設定' },
]

export default function Layout() {
  const location = useLocation()
  const current = location.pathname.replace(/^\//, '')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-mint/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
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

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Mobile Nav */}
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

      {/* Footer spacer for mobile */}
      <div className="sm:hidden h-16" />
    </div>
  )
}
