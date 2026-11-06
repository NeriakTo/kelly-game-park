import { Link } from 'react-router-dom'
import { TopBar, Spacer } from '../components/UI/TopBar'
import { BrandMark } from '../components/art/scenery'
import { LockIcon } from '../components/art/icons'
import SoundToggle from '../components/UI/SoundToggle'
import ContinueBanner from './home/ContinueBanner'
import { AlbumCard, BrainZone, ChessZone, MathZone, TypingCard } from './home/HomeZones'

// 新首頁（照示意稿 B-home）：繼續上次的遊戲、下棋區（最顯眼）、動動腦、算一算、練打字、收藏冊。
// 右上角的小鎖頭進家長區；小孩這邊沒有設定入口。

export default function Home() {
  return (
    <>
      <TopBar>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BrandMark className="h-11 w-12 flex-none sm:h-[58px] sm:w-[62px]" />
          <h1 className="topbar-title">悅悅的遊戲公園</h1>
        </div>
        <Spacer />
        <SoundToggle />
        <Link to="/parent" className="lock-btn" aria-label="家長區（請爸爸媽媽來開）">
          <LockIcon />
        </Link>
      </TopBar>
      <main className="home">
        <ContinueBanner />
        <ChessZone />
        <BrainZone />
        <MathZone />
        <TypingCard />
        <AlbumCard />
      </main>
    </>
  )
}
