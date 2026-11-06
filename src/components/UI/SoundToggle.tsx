import { useSettingsStore } from '../../stores/settingsStore'
import { playSfx, unlockAudio } from '../../audio/sfx'
import { MuteIcon, SoundIcon } from '../art/icons'

// 右上角的聲音鈕：一鍵靜音、再按一次打開（打開時「嘟」一聲讓她知道有聲音了）。
// 音量在家長區調。

export default function SoundToggle() {
  const soundOn = useSettingsStore((s) => s.soundOn)
  const setSoundOn = useSettingsStore((s) => s.setSoundOn)

  const toggle = () => {
    const next = !soundOn
    setSoundOn(next)
    if (next) {
      unlockAudio()
      playSfx('tap')
    }
  }

  return (
    <button
      type="button"
      className={`pill ${soundOn ? 'pill-sun' : ''}`}
      aria-pressed={soundOn}
      aria-label={soundOn ? '聲音：開（點一下變靜音）' : '聲音：關（點一下打開）'}
      onClick={toggle}
    >
      {soundOn ? <SoundIcon /> : <MuteIcon />}
      <span className="pill-label">{soundOn ? '聲音' : '靜音'}</span>
    </button>
  )
}
