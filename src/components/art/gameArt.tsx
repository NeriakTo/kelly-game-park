import type { GameType } from '../../types'
import { ChessPieceIcon } from './icons'

// 遊戲插圖：照示意稿 B 的剪紙風格內嵌 SVG。卡片大圖（象棋、圍棋）與小圖（其他遊戲）。
// 圖上的字（將、帥、數字）跟著網頁字型走，所以也算在字型子集裡。

type ArtProps = { className?: string }

export function ChessCardArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 230 236" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <path d="M0 170 Q60 140 120 166 T230 150 V236 H0Z" fill="#8A2A45" />
      <g transform="rotate(-7 120 130)">
        <rect x="34" y="46" width="180" height="176" rx="18" fill="#D9C39A" transform="translate(6 6)" />
        <rect x="34" y="46" width="180" height="176" rx="18" fill="#F3E2C3" />
        <g stroke="#1D3A33" strokeWidth="3">
          <path d="M54 80 H194 M54 120 H194 M54 160 H194 M54 200 H194 M84 60 V214 M124 60 V214 M164 60 V214" />
          <path d="M84 160 L164 214 M164 160 L84 214" />
        </g>
        <circle cx="92" cy="122" r="33" fill="#22573B" />
        <circle cx="88" cy="116" r="33" fill="#FFF8EC" />
        <circle cx="88" cy="116" r="25" fill="none" stroke="#1D3A33" strokeWidth="3" />
        <text x="88" y="130" textAnchor="middle" fontSize="38" fill="#1D3A33" stroke="#1D3A33" strokeWidth="1">將</text>
        <circle cx="160" cy="160" r="37" fill="#8A2A45" />
        <circle cx="155" cy="153" r="37" fill="#FFF8EC" />
        <circle cx="155" cy="153" r="28" fill="none" stroke="#B23A5B" strokeWidth="3.5" />
        <text x="155" y="168" textAnchor="middle" fontSize="42" fill="#A32A3E" stroke="#A32A3E" strokeWidth="1">帥</text>
      </g>
      <path d="M196 52 l5 -14 l5 14 l14 5 l-14 5 l-5 14 l-5 -14 l-14 -5Z" fill="#FFC94A" />
      <path d="M24 54 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3Z" fill="#FCE6EA" />
    </svg>
  )
}

export function GoCardArt({ className }: ArtProps) {
  const black = [[91, 97], [124, 130], [157, 130]]
  const white = [[157, 97], [124, 163]]
  return (
    <svg viewBox="0 0 230 236" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <path d="M0 180 Q70 150 130 176 T230 160 V236 H0Z" fill="#22573B" />
      <g transform="rotate(5 120 130)">
        <rect x="36" y="40" width="176" height="176" rx="18" fill="#D9C39A" transform="translate(6 6)" />
        <rect x="36" y="40" width="176" height="176" rx="18" fill="#F3E2C3" />
        <g stroke="#1D3A33" strokeWidth="2.5">
          <path d="M58 64 H190 M58 97 H190 M58 130 H190 M58 163 H190 M58 196 H190 M58 64 V196 M91 64 V196 M124 64 V196 M157 64 V196 M190 64 V196" />
        </g>
        {black.map(([x, y]) => (
          <g key={`b${x}-${y}`}>
            <circle cx={x + 3} cy={y + 3} r="15" fill="#4A6159" />
            <circle cx={x} cy={y} r="15" fill="#1D3A33" />
          </g>
        ))}
        {white.map(([x, y]) => (
          <g key={`w${x}-${y}`}>
            <circle cx={x + 3} cy={y + 3} r="15" fill="#C9D9D1" />
            <circle cx={x} cy={y} r="15" fill="#FFFDF7" />
          </g>
        ))}
      </g>
      <circle cx="196" cy="58" r="15" fill="#C9D9D1" />
      <circle cx="193" cy="54" r="15" fill="#FFFDF7" />
      <path d="M24 56 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3Z" fill="#FFC94A" />
    </svg>
  )
}

export function SudokuArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 86 86" className={className} aria-hidden="true">
      <g transform="rotate(-6 43 43)">
        <rect x="14" y="14" width="62" height="62" rx="10" fill="#1F6A85" />
        <rect x="10" y="10" width="62" height="62" rx="10" fill="#FFFDF7" />
        <path d="M41 12 V70 M12 41 H70" stroke="#1D3A33" strokeWidth="2.6" />
        <path d="M26 12 V70 M56 12 V70 M12 26 H70 M12 56 H70" stroke="#9DB8AE" strokeWidth="1.6" />
        <rect x="42.5" y="42.5" width="12" height="12" rx="2" fill="#FFC94A" />
        <g fontSize="12" textAnchor="middle" fill="#1D3A33">
          <text x="19" y="23">1</text>
          <text x="49" y="23">3</text>
          <text x="34" y="38">2</text>
          <text x="63" y="53">4</text>
          <text x="19" y="68">3</text>
          <text x="49" y="53">?</text>
        </g>
      </g>
    </svg>
  )
}

export function MemoryArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 86 86" className={className} aria-hidden="true">
      <g transform="rotate(-10 26 42)">
        <rect x="12" y="20" width="32" height="46" rx="8" fill="#164F63" />
        <rect x="9" y="17" width="32" height="46" rx="8" fill="#1F6A85" />
        <path d="M25 26 Q34 34 25 42 Q16 34 25 26Z M25 40 Q34 48 25 56 Q16 48 25 40Z" fill="#7FB8CC" />
      </g>
      <g transform="rotate(8 58 42)">
        <rect x="46" y="21" width="32" height="46" rx="8" fill="#E0A21C" />
        <rect x="43" y="18" width="32" height="46" rx="8" fill="#FFFDF7" />
        <path d="M59 32 Q59 28 63 28 Q67 28 67 33 Q67 38 59 45 Q51 38 51 33 Q51 28 55 28 Q59 28 59 32Z" fill="#B23A5B" />
      </g>
    </svg>
  )
}

export function MathArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 86 86" className={className} aria-hidden="true">
      <g textAnchor="middle" fontSize="22" fill="#1D3A33">
        <rect x="7" y="31" width="25" height="25" rx="7" fill="#E0A21C" />
        <rect x="4" y="28" width="25" height="25" rx="7" fill="#FFC94A" />
        <text x="16.5" y="48">3</text>
        <g transform="rotate(8 43 34)">
          <rect x="33" y="23" width="25" height="25" rx="7" fill="#C9D9D1" />
          <rect x="30" y="20" width="25" height="25" rx="7" fill="#FFFDF7" />
          <text x="42.5" y="40">+</text>
        </g>
        <rect x="60" y="31" width="25" height="25" rx="7" fill="#D9844F" />
        <rect x="57" y="28" width="25" height="25" rx="7" fill="#F4A97A" />
        <text x="69.5" y="48">4</text>
        <rect x="25" y="61" width="40" height="22" rx="8" fill="#8A2A45" />
        <rect x="22" y="58" width="40" height="22" rx="8" fill="#B23A5B" />
        <text x="42" y="75" fill="#fff" fontSize="18">= ?</text>
      </g>
    </svg>
  )
}

const DINO_PATH =
  'M12 64 Q10 46 28 42 Q36 40 42 46 Q48 28 58 20 Q66 14 72 18 Q78 22 72 28 Q66 30 62 36 Q60 48 64 58 Q68 66 76 68 L76 72 Q62 74 56 68 L54 74 H46 L46 66 Q38 68 32 66 L30 74 H22 L22 64 Z'

export function DinoArt({ className, withTag = true }: ArtProps & { withTag?: boolean }) {
  return (
    <svg viewBox="0 0 86 86" className={className} aria-hidden="true">
      <path d={DINO_PATH} fill="#22573B" transform="translate(3 3)" />
      <path d={DINO_PATH} fill="#5FA77A" />
      <circle cx="68" cy="22" r="2.6" fill="#1D3A33" />
      <path d="M30 50 q4 -4 8 0 M38 54 q4 -4 8 0" fill="none" stroke="#BFE0C2" strokeWidth="3" strokeLinecap="round" />
      {withTag && (
        <>
          <path d="M8 12 H30 L37 20 L30 28 H8 Z" fill="#FFFDF7" />
          <circle cx="31" cy="20" r="2" fill="#F4A97A" />
          <text x="19" y="25" textAnchor="middle" fontSize="12" fill="#1D3A33">5元</text>
        </>
      )}
    </svg>
  )
}

export function TypingArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 62 62" className={className} aria-hidden="true">
      <rect x="7" y="17" width="52" height="34" rx="9" fill="#A9CBBB" />
      <rect x="4" y="14" width="52" height="34" rx="9" fill="#FFFDF7" />
      <g fill="#DCEEF3">
        <rect x="9" y="19" width="9" height="9" rx="2.5" />
        <rect x="20" y="19" width="9" height="9" rx="2.5" />
        <rect x="31" y="19" width="9" height="9" rx="2.5" />
        <rect x="42" y="19" width="9" height="9" rx="2.5" />
        <rect x="14" y="31" width="32" height="10" rx="3" />
      </g>
      <text x="13.5" y="26.5" fontSize="8" textAnchor="middle" fill="#1D3A33">ㄅ</text>
      <text x="24.5" y="26.5" fontSize="8" textAnchor="middle" fill="#1D3A33">A</text>
    </svg>
  )
}

export function AlbumArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 62 62" className={className} aria-hidden="true">
      <rect x="12" y="9" width="42" height="50" rx="8" fill="#8A2A45" />
      <rect x="9" y="6" width="42" height="50" rx="8" fill="#B23A5B" />
      <rect x="9" y="6" width="10" height="50" rx="5" fill="#8A2A45" />
      <circle cx="35" cy="24" r="10" fill="#FFC94A" />
      <path d="M35 17.5 L37 22 L41.5 22.5 L38 25.5 L39 30 L35 27.5 L31 30 L32 25.5 L28.5 22.5 L33 22 Z" fill="#FFFDF7" />
      <path d="M26 42 Q34 34 44 42 Q34 50 26 42Z" fill="#5FA77A" />
    </svg>
  )
}

function GoStoneBadge({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
      <circle cx="16" cy="17" r="12" fill="#4A6159" />
      <circle cx="15" cy="15" r="12" fill="#1D3A33" />
      <circle cx="11" cy="11" r="3" fill="#45615A" />
    </svg>
  )
}

/** 頂列遊戲名前面的小圖 */
export function GameBadge({ game, className }: ArtProps & { game: GameType }) {
  switch (game) {
    case 'chess':
      return <ChessPieceIcon className={className} />
    case 'go':
      return <GoStoneBadge className={className} />
    case 'sudoku':
      return <SudokuArt className={className} />
    case 'memory':
      return <MemoryArt className={className} />
    case 'math':
      return <MathArt className={className} />
    case 'dino-shop':
      return <DinoArt className={className} withTag={false} />
    case 'typing':
      return <TypingArt className={className} />
  }
}

/** 首頁「繼續上次的遊戲」左邊的小方塊：棋類畫一角棋盤，其他遊戲用頂列小圖 */
export function ContinueThumb({ game, className }: ArtProps & { game: GameType }) {
  if (game === 'chess') {
    return (
      <svg viewBox="0 0 84 84" className={className} aria-hidden="true">
        <path d="M0 14 H84 M0 42 H84 M0 70 H84 M14 0 V84 M42 0 V84 M70 0 V84" stroke="#1D3A33" strokeWidth="2" />
        <circle cx="45" cy="42" r="17" fill="#8A2A45" />
        <circle cx="42" cy="38" r="17" fill="#FFF8EC" />
        <circle cx="42" cy="38" r="12.5" fill="none" stroke="#B23A5B" strokeWidth="2.5" />
        <text x="42" y="46" textAnchor="middle" fontSize="20" fill="#A32A3E">傌</text>
        <circle cx="72" cy="72" r="9" fill="#22573B" />
        <circle cx="70" cy="70" r="9" fill="#FFFDF7" />
        <circle cx="70" cy="70" r="6" fill="#2F7650" />
      </svg>
    )
  }
  if (game === 'go') {
    return (
      <svg viewBox="0 0 84 84" className={className} aria-hidden="true">
        <path d="M0 14 H84 M0 42 H84 M0 70 H84 M14 0 V84 M42 0 V84 M70 0 V84" stroke="#1D3A33" strokeWidth="2" />
        <circle cx="44" cy="44" r="13" fill="#4A6159" />
        <circle cx="42" cy="42" r="13" fill="#1D3A33" />
        <circle cx="72" cy="16" r="12" fill="#D9C39A" />
        <circle cx="70" cy="14" r="12" fill="#FFFDF7" />
      </svg>
    )
  }
  return <GameBadge game={game} className={className} />
}
