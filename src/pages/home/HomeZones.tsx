import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { GO_PROGRESS_KEY } from '../../games/go/types'
import { loadCollection, countFossilPieces } from '../../games/dino-shop/collection'
import { Songsong } from '../../components/art/scenery'
import { BulbIcon, CalcIcon, ChessPieceIcon, LaptopIcon } from '../../components/art/icons'
import {
  AlbumArt, ChessCardArt, DinoArt, GoCardArt, MathArt, MemoryArt, SudokuArt, TypingArt,
} from '../../components/art/gameArt'
import { BigGameCard, SmallGameCard } from './ParkCards'

// 首頁的四個分區＋打字＋收藏冊。

const GRADE_WORD = ['一', '二', '三', '四', '五', '六']

function goLessonsDone(): number {
  try {
    const raw = localStorage.getItem(GO_PROGRESS_KEY)
    const parsed = raw ? (JSON.parse(raw) as { completedLessons?: unknown }) : null
    return Array.isArray(parsed?.completedLessons) ? parsed.completedLessons.length : 0
  } catch {
    return 0
  }
}

export function ChessZone() {
  const nickname = useGameStore((s) => s.profile.nickname)
  const avatar = useGameStore((s) => s.profile.avatar)
  const lessons = useMemo(goLessonsDone, [])

  return (
    <section className="sheet sheet-berry home-chess" aria-label="下棋">
      <div className="ribbon ribbon-berry">
        <ChessPieceIcon />
        下棋 <small>悅悅最常玩</small>
      </div>
      <div className="pair">
        <BigGameCard game="chess" art={<ChessCardArt />} artTone="art-berry" shadow="berry" />
        <BigGameCard
          game="go"
          art={<GoCardArt />}
          artTone="art-pine"
          shadow="berry"
          tapeTilt={3}
          tagline={lessons > 0 ? `上完 ${lessons} 課` : '一課一課學'}
        />
      </div>
      <div className="home-buddy">
        <Songsong />
        <div className="bubble bubble-left">
          <p>
            嗨，{nickname}！<span aria-hidden="true">{avatar}</span>
          </p>
          <p>今天想玩什麼呢？</p>
        </div>
      </div>
    </section>
  )
}

export function BrainZone() {
  return (
    <section className="sheet sheet-lake home-brain" aria-label="動動腦">
      <div className="ribbon ribbon-lake">
        <BulbIcon />
        動動腦
      </div>
      <div className="zone-cards">
        <SmallGameCard game="sudoku" art={<SudokuArt />} artTone="art-lake" shadow="lake" />
        <SmallGameCard game="memory" art={<MemoryArt />} artTone="art-sun" shadow="lake" />
      </div>
    </section>
  )
}

export function MathZone() {
  const grade = useSettingsStore((s) => s.grade)
  return (
    <section className="sheet sheet-pine home-math" aria-label="算一算">
      <div className="ribbon ribbon-pine">
        <CalcIcon />
        算一算
      </div>
      <div className="zone-cards">
        <SmallGameCard
          game="math"
          art={<MathArt />}
          artTone="art-mint"
          shadow="pine"
          tagline={`${GRADE_WORD[grade - 1]}年級題目`}
        />
        <SmallGameCard game="dino-shop" art={<DinoArt />} artTone="art-peach" shadow="pine" />
      </div>
    </section>
  )
}

export function TypingCard() {
  return (
    <Link to="/typing" className="mini-card home-type" aria-label="練打字，要用筆電玩">
      <TypingArt />
      <div>
        <div className="name">練打字</div>
        <span className="laptop-tag">
          <LaptopIcon />
          用筆電玩
        </span>
      </div>
    </Link>
  )
}

export function AlbumCard() {
  const pieces = useMemo(() => countFossilPieces(loadCollection()), [])
  return (
    <Link to="/album" className="mini-card home-album" aria-label={`我的收藏冊，收集到 ${pieces} 片化石`}>
      <AlbumArt />
      <div>
        <div className="name">我的收藏冊</div>
        <div className="sub">化石都在這裡</div>
      </div>
      <div className="count" aria-hidden="true">
        {pieces}
        <small>片</small>
      </div>
    </Link>
  )
}
