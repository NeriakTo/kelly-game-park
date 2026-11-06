// 背景山丘、站名旁的小森林、陪玩角色松松（剪紙松果，自創角色）

type ArtProps = { className?: string }

export function Hills() {
  return (
    <div className="scenery" aria-hidden="true">
      <svg viewBox="0 0 1200 400" preserveAspectRatio="none">
        <path d="M0 210 Q160 120 330 190 T690 170 T1020 150 T1200 170 V400 H0Z" fill="#CFE6D2" />
        <path d="M0 270 Q200 190 420 250 T840 230 T1200 240 V400 H0Z" fill="#B3D9BA" transform="translate(0 6)" />
        <path d="M0 270 Q200 190 420 250 T840 230 T1200 240 V400 H0Z" fill="#C3E2C7" />
        <path d="M0 330 Q260 270 560 320 T1200 300 V400 H0Z" fill="#9CCDA6" transform="translate(0 6)" />
        <path d="M0 330 Q260 270 560 320 T1200 300 V400 H0Z" fill="#B0D8B5" />
      </svg>
    </div>
  )
}

export function BrandMark({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 62 58" className={className} aria-hidden="true">
      <circle cx="44" cy="16" r="11" fill="#E0A21C" transform="translate(2 2)" />
      <circle cx="44" cy="16" r="11" fill="#FFC94A" />
      <path d="M2 54 Q20 34 38 46 Q50 38 60 54Z" fill="#22573B" transform="translate(0 2)" />
      <path d="M2 54 Q20 34 38 46 Q50 38 60 54Z" fill="#5FA77A" />
      <path d="M16 6 L28 30 H4Z" fill="#22573B" transform="translate(2 2)" />
      <path d="M16 6 L28 30 H4Z" fill="#2F7650" />
      <path d="M16 20 L26 40 H6Z" fill="#22573B" transform="translate(2 2)" />
      <path d="M16 20 L26 40 H6Z" fill="#2F7650" />
      <rect x="14" y="40" width="5" height="8" rx="1.5" fill="#8E5426" />
      <circle cx="40" cy="44" r="4" fill="#B23A5B" />
      <circle cx="48" cy="46" r="3" fill="#F4A97A" />
    </svg>
  )
}

/** 松松：戴葉子帽的剪紙松果。shadow 是腳下影子的顏色，跟著底下的紙片換色。 */
export function Songsong({ className, shadow = '#F2B8C5' }: ArtProps & { shadow?: string }) {
  return (
    <svg viewBox="0 0 160 190" className={className} role="img" aria-label="陪玩角色松松">
      <ellipse cx="80" cy="182" rx="46" ry="7" fill={shadow} />
      <ellipse cx="62" cy="174" rx="13" ry="8" fill="#6E4421" />
      <ellipse cx="98" cy="174" rx="13" ry="8" fill="#6E4421" />
      <path d="M30 108 Q10 96 14 76" fill="none" stroke="#8E5426" strokeWidth="10" strokeLinecap="round" />
      <path d="M130 112 Q148 120 146 138" fill="none" stroke="#8E5426" strokeWidth="10" strokeLinecap="round" />
      <path d="M80 40 C124 40 140 86 136 120 C132 156 110 176 80 176 C50 176 28 156 24 120 C20 86 36 40 80 40Z" fill="#6E4421" transform="translate(5 5)" />
      <path d="M80 40 C124 40 140 86 136 120 C132 156 110 176 80 176 C50 176 28 156 24 120 C20 86 36 40 80 40Z" fill="#B9773F" />
      <g fill="#8E5426">
        <path d="M34 128 q12 16 24 0 q-12 6 -24 0Z" />
        <path d="M58 128 q12 16 24 0 q-12 6 -24 0Z" />
        <path d="M82 128 q12 16 24 0 q-12 6 -24 0Z" />
        <path d="M106 128 q12 16 24 0 q-12 6 -24 0Z" />
        <path d="M44 148 q12 16 24 0 q-12 6 -24 0Z" />
        <path d="M68 148 q12 16 24 0 q-12 6 -24 0Z" />
        <path d="M92 148 q12 16 24 0 q-12 6 -24 0Z" />
      </g>
      <g fill="#D29558">
        <path d="M46 138 q10 10 20 0Z" />
        <path d="M70 138 q10 10 20 0Z" />
        <path d="M94 138 q10 10 20 0Z" />
        <path d="M58 158 q10 10 20 0Z" />
        <path d="M82 158 q10 10 20 0Z" />
      </g>
      <ellipse cx="80" cy="92" rx="42" ry="32" fill="#F6DDB8" />
      <ellipse cx="64" cy="90" rx="6.5" ry="8.5" fill="#1D3A33" />
      <circle cx="66" cy="87" r="2.6" fill="#fff" />
      <ellipse cx="96" cy="90" rx="6.5" ry="8.5" fill="#1D3A33" />
      <circle cx="98" cy="87" r="2.6" fill="#fff" />
      <ellipse cx="50" cy="104" rx="8" ry="5" fill="#F08FA0" />
      <ellipse cx="110" cy="104" rx="8" ry="5" fill="#F08FA0" />
      <path d="M72 104 Q80 112 88 104" fill="none" stroke="#1D3A33" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 46 Q66 10 112 14 Q108 52 60 46Z" fill="#22573B" transform="translate(4 4)" />
      <path d="M60 46 Q66 10 112 14 Q108 52 60 46Z" fill="#5FA77A" />
      <path d="M64 42 Q84 30 106 18" fill="none" stroke="#BFE0C2" strokeWidth="3" strokeLinecap="round" />
      <path d="M80 40 L72 28" stroke="#6E4421" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}
