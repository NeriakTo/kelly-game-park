import { Link } from 'react-router-dom'
import type { GameType } from '../../types'
import { LEVELS, LEVEL_LABEL, type Level } from '../../data/levels'
import { LEVEL_KID_HINT } from '../../data/levelMap'
import { useProgressStore, starsFor } from '../../stores/progressStore'
import { useSettingsStore } from '../../stores/settingsStore'
import Stars, { starsText } from '../UI/Stars'
import { Songsong } from '../art/scenery'
import { playSfx } from '../../audio/sfx'

// 選關畫面：簡單、普通、挑戰三個大按鈕，各自顯示已經拿到的星星。
// 家長在家長區設了推薦關卡的話，那一關貼上「爸媽推薦」紙膠帶。

const LEVEL_STYLE: Record<Level, string> = {
  easy: 'bg-pine shadow-[0_8px_0_var(--color-pine-d)]',
  normal: 'bg-lake shadow-[0_8px_0_var(--color-lake-d)]',
  hard: 'bg-berry shadow-[0_8px_0_var(--color-berry-d)]',
}

export default function LevelPicker({ game, extraHint }: { game: GameType; extraHint?: string }) {
  const best = useProgressStore((s) => s.bestStars)
  const recommended = useSettingsStore((s) => s.recommendedLevels[game])

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6">
      <div className="flex items-end gap-2">
        <Songsong className="h-[118px] w-[100px] flex-none" shadow="#BFDCCB" />
        <div className="bubble bubble-left mb-8">
          <p>選一個關卡吧！</p>
          {extraHint && <p className="text-[17px] text-moss">{extraHint}</p>}
        </div>
      </div>

      <nav aria-label="選關卡" className="mt-6 grid gap-6 md:grid-cols-3">
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
              className={`relative flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-[28px] px-4 py-5 text-white no-underline transition-transform active:translate-y-1 ${LEVEL_STYLE[level]}`}
            >
              {isRecommended && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-3 rounded-md bg-sun px-3 py-0.5 text-[17px] text-ink">
                  爸媽推薦
                </span>
              )}
              <span className="text-[36px] leading-tight">{LEVEL_LABEL[level]}</span>
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
