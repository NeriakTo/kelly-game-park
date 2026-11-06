import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { GameType } from '../types'
import { isLevel } from '../data/levels'
import GameShell from '../components/GameShell/GameShell'
import LevelPicker from '../components/GameShell/LevelPicker'
import NeedsKeyboard from '../components/GameShell/NeedsKeyboard'
import ResultSheet from '../components/GameShell/ResultSheet'
import { GameSessionContext, type GameSession } from '../components/GameShell/session'
import { useProgressStore } from '../stores/progressStore'
import { setActiveSession } from '../stores/activeSession'
import { GAMES } from '../data/games'
import { isTouchOnlyDevice } from '../utils/device'
import { playSfx } from '../audio/sfx'
import type { Level } from '../data/levels'

// 每個遊戲共用的頁面：/<遊戲> 是選關畫面，/<遊戲>/<關卡> 是遊戲本身（套上遊戲外框）。
// 網址的關卡看不懂時（例如 /memory/super），一樣回到選關畫面。
// 要鍵盤的遊戲（打字）在沒接鍵盤的觸控裝置上，先顯示「要用筆電玩」的提示。
// 遊戲用 reportResult 回報星星後，記下最佳星星、播過關音效、打開過關畫面。

export default function GamePage({ game, children }: { game: GameType; children: ReactNode }) {
  const params = useParams()
  const level = isLevel(params.level) ? params.level : null
  const reportStars = useProgressStore((s) => s.reportStars)
  const recordPlay = useProgressStore((s) => s.recordPlay)
  const [keyboardSeen, setKeyboardSeen] = useState(false)
  const onKeyboard = useCallback(() => setKeyboardSeen(true), [])
  // round：按「再玩一次」就加一，讓遊戲整個重新開始；result 記是哪一關的，換關後自然不顯示
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{ level: Level; stars: 1 | 2 | 3 } | null>(null)
  const needsKeyboard = Boolean(GAMES[game].needsKeyboard) && !keyboardSeen && isTouchOnlyDevice()

  // 真的開始玩（網址有關卡、而且遊戲有顯示出來）才記成「最後玩的遊戲」；只看選關畫面不算
  useEffect(() => {
    if (!level || needsKeyboard) return
    recordPlay(game, level)
    setActiveSession({ game, level })
    return () => setActiveSession(null)
  }, [game, level, needsKeyboard, recordPlay])

  const session = useMemo<GameSession | null>(
    () =>
      level
        ? {
            game,
            level,
            reportResult: (stars) => {
              reportStars(game, level, stars)
              playSfx('win')
              setResult({ level, stars })
            },
          }
        : null,
    [game, level, reportStars],
  )

  const replay = useCallback(() => {
    setResult(null)
    setRound((r) => r + 1)
  }, [])

  return (
    <GameShell game={game} level={level}>
      {needsKeyboard ? (
        <NeedsKeyboard onKeyboard={onKeyboard} />
      ) : session ? (
        <GameSessionContext.Provider value={session}>
          <main className="mx-auto w-full max-w-6xl px-3 pb-12 pt-8 sm:px-6">
            {/* key：換關卡或再玩一次時整個遊戲重新開始；data-game-root：截圖檢查用來數遊戲掛了幾份 */}
            {/* 橫向捲動放在內層：外層要留給紙影，捲動容器會把紙影裁掉 */}
            <div key={`${level}-${round}`} data-game-root={game} className="sheet sheet-paper items-center p-2 sm:p-4">
              <div className="max-w-full overflow-x-auto">{children}</div>
            </div>
          </main>
          {result && result.level === level && (
            <ResultSheet game={game} level={level} stars={result.stars} onReplay={replay} />
          )}
        </GameSessionContext.Provider>
      ) : (
        <LevelPicker game={game} />
      )}
    </GameShell>
  )
}
