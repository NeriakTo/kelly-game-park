import { useSettingsStore } from '../../../stores/settingsStore'
import { playSfx, unlockAudio } from '../../../audio/sfx'
import BigButton from '../../../components/UI/BigButton'
import SwitchRow from '../../../components/UI/Switch'
import Section from './Section'

// 聲音：開關（跟首頁右上角的聲音鈕是同一個）與音量，可以試聽。

export default function SoundSection() {
  const soundOn = useSettingsStore((s) => s.soundOn)
  const volume = useSettingsStore((s) => s.volume)
  const setSoundOn = useSettingsStore((s) => s.setSoundOn)
  const setVolume = useSettingsStore((s) => s.setVolume)
  const percent = Math.round(volume * 100)

  return (
    <Section title="聲音" note="音效是點擊、答對、答錯、過關四種短音。孩子在首頁與遊戲頁右上角也能一鍵靜音。">
      <SwitchRow label="播放音效" checked={soundOn} onChange={setSoundOn} />
      <label className="flex flex-col gap-2">
        <span className="text-[20px]">音量 {percent}%</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          aria-label="音量"
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="h-12 w-full accent-[var(--color-pine)]"
        />
      </label>
      <div>
        <BigButton
          variant="secondary"
          disabled={!soundOn}
          onClick={() => {
            unlockAudio()
            playSfx('correct')
          }}
        >
          試聽
        </BigButton>
      </div>
    </Section>
  )
}
