import { useEffect, useId, useRef } from 'react'
import type { GameType } from '../../types'
import { LEVEL_LABEL, nextLevel, type Level } from '../../data/levels'
import { gameName } from '../../data/games'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { Songsong } from '../art/scenery'
import { StarIcon, RetryIcon, PlayIcon } from '../art/icons'
import { starsText } from '../UI/Stars'
import BigButton from '../UI/BigButton'

// 過關畫面：星星一顆顆跳出來（系統設定減少動態效果時直接出現），
// 下面是「再玩一次／下一關／回首頁」。挑戰已經是最後一關，就沒有「下一關」。

const CHEERS: Record<1 | 2 | 3, string> = {
  1: '完成了！下次再挑戰更多星星',
  2: '很棒喔！差一點就三顆星',
  3: '太厲害了！三顆星全拿',
}

interface ResultSheetProps {
  readonly game: GameType
  readonly level: Level
  readonly stars: 1 | 2 | 3
  readonly onReplay: () => void
}

export default function ResultSheet({ game, level, stars, onReplay }: ResultSheetProps) {
  const titleId = useId()
  const reduceMotion = useReducedMotion()
  const firstRef = useRef<HTMLDivElement>(null)
  const next = nextLevel(level)

  useEffect(() => {
    firstRef.current?.querySelector<HTMLElement>('a, button')?.focus()
  }, [])

  return (
    <div className="modal-backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-card text-center">
        <Songsong className="mx-auto h-[118px] w-[100px]" shadow="#FFC94A" />
        <h2 id={titleId} className="m-0 text-[32px] font-normal">過關了！</h2>
        <p className="m-0 text-moss">{gameName(game)}・{LEVEL_LABEL[level]}</p>
        <div role="img" aria-label={starsText(stars)} className="my-3 flex justify-center gap-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={i < stars && !reduceMotion ? 'star-pop' : undefined}
              style={i < stars && !reduceMotion ? { animationDelay: `${0.15 + i * 0.2}s` } : undefined}
            >
              <StarIcon filled={i < stars} className="h-14 w-14" />
            </span>
          ))}
        </div>
        <p className="m-0 text-[21px]">{CHEERS[stars]}</p>
        <div ref={firstRef} className="mt-5 flex flex-wrap justify-center gap-3">
          {next && (
            <BigButton variant="primary" to={`/${game}/${next}`} icon={<PlayIcon className="h-6 w-6" />}>
              下一關（{LEVEL_LABEL[next]}）
            </BigButton>
          )}
          <BigButton variant={next ? 'secondary' : 'primary'} onClick={onReplay} icon={<RetryIcon className="h-6 w-6" />}>
            再玩一次
          </BigButton>
          <BigButton variant="secondary" to="/">回首頁</BigButton>
        </div>
      </div>
    </div>
  )
}
