import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BackIcon } from '../art/icons'

// 紙條頂列（波浪下緣）。內容由各頁決定：左邊放回首頁或站名，右邊放聲音、怎麼玩、家長鎖。

export function TopBar({ children }: { children: ReactNode }) {
  return <header className="topbar">{children}</header>
}

export function Spacer() {
  return <div className="flex-1" />
}

export function BackHomeButton() {
  return (
    <Link to="/" className="pill" aria-label="回首頁">
      <BackIcon />
      <span className="pill-label">回首頁</span>
    </Link>
  )
}
