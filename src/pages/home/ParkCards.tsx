import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { GameType } from '../../types'
import { GAMES } from '../../data/games'
import { useProgressStore, bestOfGame } from '../../stores/progressStore'
import Stars, { starsText } from '../../components/UI/Stars'
import { PlayIcon } from '../../components/art/icons'
import { playSfx } from '../../audio/sfx'

// 首頁的遊戲卡片：整張可點，進到該遊戲的選關畫面。星星是各關裡最好的一關。

interface CardProps {
  readonly game: GameType
  readonly art: ReactNode
  readonly artTone: string
  readonly shadow: 'berry' | 'lake' | 'pine'
  readonly tagline?: string
}

function useBest(game: GameType): number {
  return useProgressStore((s) => bestOfGame(s.bestStars, game))
}

export function BigGameCard({ game, art, artTone, shadow, tagline, tapeTilt = -4 }: CardProps & { tapeTilt?: number }) {
  const best = useBest(game)
  const entry = GAMES[game]
  return (
    <Link to={`/${game}`} className={`park-card big sh-${shadow}`} aria-label={`${entry.name}，${starsText(best)}`} onClick={() => playSfx('tap')}>
      <span className="tape" aria-hidden="true" style={{ transform: `rotate(${tapeTilt}deg)` }} />
      <div className={`art ${artTone}`}>{art}</div>
      <div className="label">
        <span className="name">{entry.name}</span>
        <span className="sub">{tagline ?? entry.tagline}</span>
        <Stars count={best} />
        <span className="go-btn" aria-hidden="true">
          <PlayIcon />
          開始下棋
        </span>
      </div>
    </Link>
  )
}

export function SmallGameCard({ game, art, artTone, shadow, tagline }: CardProps) {
  const best = useBest(game)
  const entry = GAMES[game]
  return (
    <Link to={`/${game}`} className={`park-card small sh-${shadow}`} aria-label={`${entry.name}，${starsText(best)}`} onClick={() => playSfx('tap')}>
      <div className={`art ${artTone}`}>{art}</div>
      <div className="label">
        <span className="name">{entry.name}</span>
        <span className="sub">{tagline ?? entry.tagline}</span>
        <Stars count={best} />
      </div>
    </Link>
  )
}
