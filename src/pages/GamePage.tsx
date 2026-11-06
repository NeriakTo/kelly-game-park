import { useEffect, useMemo, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { GameType } from '../types'
import { isLevel } from '../data/levels'
import GameShell from '../components/GameShell/GameShell'
import LevelPicker from '../components/GameShell/LevelPicker'
import { GameSessionContext, type GameSession } from '../components/GameShell/session'
import { useProgressStore } from '../stores/progressStore'
import { setActiveSession } from '../stores/activeSession'

// 每個遊戲共用的頁面：/<遊戲> 是選關畫面，/<遊戲>/<關卡> 是遊戲本身（套上遊戲外框）。
// 網址的關卡看不懂時（例如 /memory/super），一樣回到選關畫面。

export default function GamePage({ game, children }: { game: GameType; children: ReactNode }) {
  const params = useParams()
  const level = isLevel(params.level) ? params.level : null
  const reportStars = useProgressStore((s) => s.reportStars)

  useEffect(() => {
    if (!level) return
    setActiveSession({ game, level })
    return () => setActiveSession(null)
  }, [game, level])

  const session = useMemo<GameSession | null>(
    () => (level ? { game, level, reportResult: (stars) => reportStars(game, level, stars) } : null),
    [game, level, reportStars],
  )

  return (
    <GameShell game={game} level={level}>
      {session ? (
        <GameSessionContext.Provider value={session}>
          <main className="mx-auto w-full max-w-6xl px-3 pb-12 pt-8 sm:px-6">
            {/* key：換關卡時整個遊戲重新開始；data-game-root：截圖檢查用來數遊戲掛了幾份 */}
            <div key={level} data-game-root={game} className="sheet sheet-paper items-center overflow-x-auto p-2 sm:p-4">
              {children}
            </div>
          </main>
        </GameSessionContext.Provider>
      ) : (
        <LevelPicker game={game} />
      )}
    </GameShell>
  )
}
