import { useCallback, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { GameType } from '../../types'
import { GAMES } from '../../data/games'
import { LEVEL_LABEL, type Level } from '../../data/levels'
import { TopBar, BackHomeButton, Spacer } from '../UI/TopBar'
import { HelpIcon } from '../art/icons'
import { GameBadge } from '../art/gameArt'
import HelpSheet from './HelpSheet'

// 遊戲外框：頂列（回首頁、遊戲名、怎麼玩），下面放選關畫面或遊戲本身。
// 正在玩的時候，遊戲名旁邊有目前關卡，點了回到選關畫面換一關（窄螢幕不顯示）。

interface GameShellProps {
  readonly game: GameType
  readonly level: Level | null
  readonly trailing?: ReactNode
  readonly children: ReactNode
}

export default function GameShell({ game, level, trailing, children }: GameShellProps) {
  const entry = GAMES[game]
  const [helpOpen, setHelpOpen] = useState(false)
  const closeHelp = useCallback(() => setHelpOpen(false), [])

  return (
    <>
      <TopBar>
        <BackHomeButton />
        <div className="flex min-w-0 items-center gap-2">
          <GameBadge game={game} className="hidden h-11 w-11 flex-none sm:block" />
          <h1 className="topbar-title">{entry.name}</h1>
        </div>
        {level && (
          <Link
            to={`/${game}`}
            className="pill hidden md:inline-flex"
            aria-label={`換一關（現在是${LEVEL_LABEL[level]}）`}
          >
            {LEVEL_LABEL[level]}
          </Link>
        )}
        <Spacer />
        {trailing}
        <button type="button" className="pill" aria-label="怎麼玩" onClick={() => setHelpOpen(true)}>
          <HelpIcon />
          <span className="pill-label">怎麼玩</span>
        </button>
      </TopBar>
      {children}
      {helpOpen && <HelpSheet title={entry.name} lines={entry.howTo} onClose={closeHelp} />}
    </>
  )
}
