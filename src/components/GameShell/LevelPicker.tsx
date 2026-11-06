import { Link } from 'react-router-dom'
import type { GameType } from '../../types'
import { LEVELS, LEVEL_LABEL, type Level } from '../../data/levels'
import { LEVEL_KID_HINT } from '../../data/levelMap'
import { useProgressStore, starsFor } from '../../stores/progressStore'
import { useSettingsStore } from '../../stores/settingsStore'
import Stars, { starsText } from '../UI/Stars'
import { Songsong } from '../art/scenery'
import { ContinueThumb } from '../art/gameArt'
import { GAMES } from '../../data/games'
import { playSfx } from '../../audio/sfx'

// 選關畫面：簡單、普通、挑戰三個大按鈕，各自顯示已經拿到的星星。
// 家長在家長區設了推薦關卡的話，那一關貼上「爸媽推薦」紙膠帶。
// 每一關上方用一到三片葉子表示難度（不必認字也看得懂）。

const LEVEL_STYLE: Record<Level, string> = {
  easy: 'bg-pine shadow-[0_8px_0_var(--color-pine-d)]',
  normal: 'bg-lake shadow-[0_8px_0_var(--color-lake-d)]',
  hard: 'bg-berry shadow-[0_8px_0_var(--color-berry-d)]',
}

const LEAVES: Record<Level, number> = { easy: 1, normal: 2, hard: 3 }
const VEIN: Record<Level, string> = { easy: '#22573B', normal: '#164F63', hard: '#8A2A45' }

function LevelLeaves({ level }: { level: Level }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: LEAVES[level] }, (_, i) => (
        <svg key={i} viewBox="0 0 28 28" className="h-8 w-8">
          <ellipse cx="15" cy="13" rx="11" ry="6.5" transform="rotate(-40 15 13)" fill="#FFFDF7" />
          <path d="M3 25 L8 20 M8 20 L22 6" stroke={VEIN[level]} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ))}
    </span>
  )
}

export default function LevelPicker({ game, extraHint }: { game: GameType; extraHint?: string }) {
  const best = useProgressStore((s) => s.bestStars)
  const recommended = useSettingsStore((s) => s.recommendedLevels[game])

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 md:pt-12">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="hidden flex-none overflow-hidden rounded-[22px] bg-[#F3E2C3] shadow-[5px_6px_0_#BFDCCB] sm:block" aria-hidden="true">
          <ContinueThumb game={game} className="block h-[104px] w-[104px] p-1" />
        </div>
        <Songsong className="h-[118px] w-[100px] flex-none" shadow="#BFDCCB" />
        <div className="bubble bubble-left mb-8 min-w-0 flex-1 sm:flex-none">
          <p>{GAMES[game].name}，選一個關卡吧！</p>
          {extraHint && <p className="text-[17px] text-moss">{extraHint}</p>}
        </div>
      </div>

      <nav aria-label="選關卡" className="mt-8 grid gap-6 md:grid-cols-3">
        {LEVELS.map((level) => {
          const stars = starsFor(best, game, level)
          const isRecommended = recommended === level
          const label = [LEVEL_LABEL[level], starsText(stars), isRecommended ? '爸媽推薦' : null].filter(Boolean).join('，')
          return (
            <Link
              key={level}
              to={`/${game}/${level}`}
              aria-label={label}
              onClick={() => playSfx('tap')}
              className={`relative flex min-h-[148px] flex-col md:min-h-[230px] items-center justify-center gap-2 rounded-[28px] px-4 py-5 text-white no-underline transition-transform active:translate-y-1 ${LEVEL_STYLE[level]}`}
            >
              {isRecommended && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-3 rounded-md bg-sun px-3 py-0.5 text-[17px] text-ink">
                  爸媽推薦
                </span>
              )}
              <LevelLeaves level={level} />
              <span className="text-[36px] leading-tight md:text-[40px]">{LEVEL_LABEL[level]}</span>
              <span className="text-[19px]">{LEVEL_KID_HINT[game][level]}</span>
              <span className="rounded-full bg-paper px-3 py-1">
                <Stars count={stars} />
              </span>
            </Link>
          )
        })}
      </nav>
    </main>
  )
}
