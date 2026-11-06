import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, BackHomeButton, Spacer } from '../../components/UI/TopBar'
import { LockIcon } from '../../components/art/icons'
import { isParentUnlocked, lockParent, unlockParent } from '../../stores/parentGate'
import ParentGate from './ParentGate'
import GradeSection from './sections/GradeSection'
import LevelsSection from './sections/LevelsSection'
import SoundSection from './sections/SoundSection'
import AISection from './sections/AISection'
import RecordsSection from './sections/RecordsSection'
import ProfileSection from './sections/ProfileSection'

// 家長區：原本設定頁的全部功能都搬到這裡，孩子那邊不再有設定入口。
// 進來先過家長驗證；通過後 10 分鐘內再進來不用再驗。

export default function ParentPage() {
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(() => isParentUnlocked())

  const pass = () => {
    unlockParent()
    setUnlocked(true)
  }

  return (
    <>
      <TopBar>
        <BackHomeButton />
        <h1 className="topbar-title flex items-center gap-2">
          <LockIcon className="h-8 w-8 flex-none" />
          家長區
        </h1>
        <Spacer />
        {unlocked && (
          <button
            type="button"
            className="pill"
            onClick={() => {
              lockParent()
              navigate('/')
            }}
          >
            鎖上
          </button>
        )}
      </TopBar>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-16 pt-10">
        {unlocked ? (
          <>
            <GradeSection />
            <LevelsSection />
            <SoundSection />
            <AISection />
            <RecordsSection />
            <ProfileSection />
          </>
        ) : (
          <ParentGate onPass={pass} />
        )}
      </main>
    </>
  )
}
