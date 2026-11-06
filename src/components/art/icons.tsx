// 小圖示：照示意稿 B 的內嵌 SVG。全部是裝飾（aria-hidden），按鈕本身要有文字或 aria-label。

type IconProps = { className?: string }

const STAR_PATH = 'M16 3.5 L19.8 11.3 L28.3 12.4 L22.1 18.3 L23.7 26.8 L16 22.7 L8.3 26.8 L9.9 18.3 L3.7 12.4 L12.2 11.3 Z'

export function StarIcon({ className, filled }: IconProps & { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden="true" data-star="filled">
        <path d={STAR_PATH} fill="#E0A21C" stroke="#E0A21C" strokeWidth="3" strokeLinejoin="round" transform="translate(1.2 1.6)" />
        <path d={STAR_PATH} fill="#FFC94A" stroke="#FFC94A" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" data-star="empty">
      <path d={STAR_PATH} fill="#DCE8E2" stroke="#6A847A" strokeWidth="2.2" strokeLinejoin="round" strokeDasharray="3.5 3" />
    </svg>
  )
}

export function SoundIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M4 12 H10 L17 6 V26 L10 20 H4 Z" fill="#1D3A33" stroke="#1D3A33" strokeWidth="2" strokeLinejoin="round" />
      <path d="M21 11 Q25 16 21 21 M24.5 7.5 Q31 16 24.5 24.5" fill="none" stroke="#1D3A33" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function MuteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M4 12 H10 L17 6 V26 L10 20 H4 Z" fill="#45615A" stroke="#45615A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M21 12 L29 20 M29 12 L21 20" stroke="#45615A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M10 14 V10 Q10 4 16 4 Q22 4 22 10 V14" fill="none" stroke="#45615A" strokeWidth="3.2" />
      <rect x="6" y="14" width="20" height="15" rx="5" fill="#45615A" />
      <circle cx="16" cy="20.5" r="2.4" fill="#E6F2EE" />
      <path d="M16 21 V25" stroke="#E6F2EE" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M19 6 L9 16 L19 26" fill="none" stroke="#1D3A33" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 16 H27" stroke="#1D3A33" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="17" r="13" fill="#164F63" />
      <circle cx="16" cy="15" r="13" fill="#1F6A85" />
      <path d="M11.5 11.5 Q11.5 7 16 7 Q20.5 7 20.5 11 Q20.5 13.5 17.5 15 Q16 15.8 16 18" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="16" cy="22.6" r="2.1" fill="#fff" />
    </svg>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M9 5 L27 16 L9 27 Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

export function LaptopIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="6" y="6" width="20" height="14" rx="2" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M2 25 H30" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function BulbIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
      <path d="M15 4 Q25 4 25 13 Q25 18 20 20 V24 H10 V20 Q5 18 5 13 Q5 4 15 4Z" fill="#FFC94A" />
      <rect x="10" y="25" width="10" height="3" rx="1.5" fill="#FFFDF7" />
    </svg>
  )
}

export function CalcIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
      <rect x="5" y="5" width="22" height="22" rx="6" fill="#22573B" />
      <rect x="3" y="3" width="22" height="22" rx="6" fill="#FFFDF7" />
      <path d="M9 9 V15 M6 12 H12 M16 12 H22 M16 19 H22 M6 19 H12" stroke="#2F7650" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function ChessPieceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
      <circle cx="16" cy="17" r="12" fill="#8A2A45" />
      <circle cx="15" cy="15" r="12" fill="#FFF8EC" />
      <circle cx="15" cy="15" r="8" fill="none" stroke="#B23A5B" strokeWidth="2.4" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M7 17 L13 23 L25 9" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RetryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M9 13 H20 Q27 13 27 20 Q27 27 20 27 H13" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M13 6 L6 13 L13 20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
