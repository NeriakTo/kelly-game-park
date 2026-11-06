import { useState } from 'react'
import BigButton from '../../../components/UI/BigButton'
import { useGameStore } from '../../../stores/gameStore'
import Section from './Section'

// 原本設定頁的「個人資料」：暱稱與頭像。首頁松松打招呼時會叫這個暱稱。
const AVATARS = ['🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🦄', '🐧']

export default function ProfileSection() {
  const profile = useGameStore((s) => s.profile)
  const setProfile = useGameStore((s) => s.setProfile)
  const [nickname, setNickname] = useState(profile.nickname)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [saved, setSaved] = useState(false)

  return (
    <Section title="孩子的暱稱與頭像" note="松松在首頁打招呼時會叫這個暱稱。">
      <label className="flex flex-col gap-1">
        <span className="text-[18px] text-moss">暱稱</span>
        <input
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setSaved(false) }}
          className="min-h-14 rounded-2xl border-2 border-leaf-d bg-white px-4 text-[20px]"
        />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-[18px] text-moss">頭像</span>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={avatar === a}
              aria-label={`頭像 ${a}`}
              onClick={() => { setAvatar(a); setSaved(false) }}
              className={`h-14 w-14 rounded-2xl text-[28px] ${avatar === a ? 'bg-sun ring-4 ring-sun-d' : 'bg-leaf'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <BigButton variant="secondary" onClick={() => { setProfile({ nickname: nickname.trim() || profile.nickname, avatar }); setSaved(true) }}>
          儲存
        </BigButton>
        {saved && <span className="text-pine-d">已儲存</span>}
      </div>
    </Section>
  )
}
