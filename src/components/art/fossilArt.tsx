// 收藏冊的恐龍剪紙：每隻恐龍一個簡單的剪影，下層深色錯開一點當紙影。
// 還沒找到的是虛線輪廓；找到一部分的是淡色；集滿的是飽和色。

type FossilState = 'none' | 'some' | 'done'

// 64×48 的剪影路徑（身體＋頭＋尾，各隻在頸長、頭飾、翅膀上做出差別）
const SHAPES: Record<string, string> = {
  trex: 'M8 34 C14 30 20 26 28 26 C30 18 34 12 42 12 C50 12 54 16 54 20 C54 23 50 24 46 24 L44 28 C46 32 46 36 42 38 L42 44 L38 44 L37 38 L30 38 L30 44 L26 44 L25 37 C18 37 12 36 8 34 Z',
  bronto: 'M4 36 C10 33 16 30 22 30 C26 26 34 26 40 30 C42 22 44 12 50 8 C54 6 58 8 58 11 C58 13 55 13 53 13 C50 18 48 26 48 32 C48 36 46 38 44 38 L44 44 L40 44 L39 38 L28 38 L28 44 L24 44 L23 37 C14 38 8 37 4 36 Z',
  triceratops: 'M6 32 C10 28 18 24 28 24 C34 24 40 26 42 28 L46 20 L48 26 L52 18 L54 24 C58 26 60 30 58 34 C56 36 52 36 48 35 C46 38 44 40 42 40 L42 44 L38 44 L37 39 L28 39 L28 44 L24 44 L23 38 C16 38 10 36 6 32 Z',
  stego: 'M4 36 C10 32 16 30 20 30 L22 22 L26 28 L30 18 L34 26 L38 18 L41 27 L45 22 L46 30 C50 30 54 32 56 34 C56 37 52 38 48 37 L46 40 L46 44 L42 44 L41 39 L28 39 L28 44 L24 44 L23 38 C14 38 8 38 4 36 Z',
  pterodactyl: 'M4 24 C14 18 22 18 28 22 C30 18 34 16 38 18 L54 10 C58 9 60 11 58 13 L42 22 C46 26 54 26 60 30 C50 32 42 30 36 28 C34 32 30 34 28 34 C26 30 26 28 26 27 C18 28 10 28 4 24 Z',
  raptor: 'M6 26 C12 26 18 28 24 30 C28 24 34 20 40 20 C44 14 50 12 54 14 C58 16 58 19 54 20 L48 22 C48 28 46 32 42 34 L44 40 L48 42 L46 44 L40 42 L38 36 L32 36 L32 42 L28 44 L27 36 C20 34 12 30 6 26 Z',
}

const FILL: Record<FossilState, { top: string; under: string }> = {
  none: { top: '#FFFDF7', under: '#D9C39A' },
  some: { top: '#EBD3AE', under: '#D9C39A' },
  done: { top: '#F4A97A', under: '#D9844F' },
}

export function FossilArt({ dinoId, state, className }: { dinoId: string; state: FossilState; className?: string }) {
  const d = SHAPES[dinoId] ?? SHAPES.trex
  const color = FILL[state]
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
      {state !== 'none' && <path d={d} fill={color.under} transform="translate(2 2.4)" />}
      <path
        d={d}
        fill={color.top}
        stroke={state === 'none' ? '#A68F68' : 'none'}
        strokeWidth={state === 'none' ? 1.6 : 0}
        strokeDasharray={state === 'none' ? '3 2.5' : undefined}
        strokeLinejoin="round"
      />
      {state === 'done' && <circle cx={dinoId === 'bronto' ? 54 : 48} cy={dinoId === 'bronto' ? 10 : 18} r="1.6" fill="#1D3A33" />}
    </svg>
  )
}
