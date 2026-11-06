import { useSettingsStore } from '../stores/settingsStore'

// 音效：用瀏覽器內建的 Web Audio 即時合成短音，不放音檔。
// 給各遊戲用的 API 只有一個：playSfx('tap' | 'correct' | 'wrong' | 'win')。
// 靜音或音量 0 時什麼都不做；開關與音量讀家長區／右上角聲音鈕的設定。
//
// iPad Safari 規定音訊要在使用者第一次點擊（或按鍵）時才能建立與啟動，
// 所以 installAudioUnlock() 在整頁掛一個監聽：第一次點擊時建立音訊並播一段無聲，之後才真的出聲。
// 在那之前呼叫 playSfx 會直接略過，不會出錯。

export type SfxName = 'tap' | 'correct' | 'wrong' | 'win'

interface Tone {
  readonly freq: number
  readonly endFreq?: number
  readonly start: number
  readonly dur: number
  readonly type: OscillatorType
  readonly gain: number
}

// 每種音效由幾個短音組成；頻率是赫茲，時間是秒
const RECIPES: Record<SfxName, readonly Tone[]> = {
  // 點擊：很短的一聲「嘟」
  tap: [{ freq: 660, start: 0, dur: 0.07, type: 'sine', gain: 0.6 }],
  // 答對：往上的兩個音
  correct: [
    { freq: 784, start: 0, dur: 0.12, type: 'triangle', gain: 0.7 },
    { freq: 1047, start: 0.1, dur: 0.2, type: 'triangle', gain: 0.7 },
  ],
  // 答錯：柔和、往下滑的低音（不要嚇到她）
  wrong: [{ freq: 330, endFreq: 247, start: 0, dur: 0.3, type: 'triangle', gain: 0.55 }],
  // 過關：Do Mi Sol 高音 Do
  win: [523, 659, 784, 1047].map((freq, i) => ({
    freq,
    start: i * 0.11,
    dur: i === 3 ? 0.4 : 0.14,
    type: 'triangle' as OscillatorType,
    gain: 0.7,
  })),
}

// 音量 1 時主音量是 0.5，避免最大聲時太刺耳
const MASTER_SCALE = 0.5

let ctx: AudioContext | null = null
let master: GainNode | null = null
let silentPlayed = false

type AudioCtor = new () => AudioContext

function audioCtor(): AudioCtor | null {
  const g = globalThis as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor }
  return g.AudioContext ?? g.webkitAudioContext ?? null
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = audioCtor()
  if (!Ctor) return null
  try {
    ctx = new Ctor()
    master = ctx.createGain()
    master.connect(ctx.destination)
  } catch (error) {
    console.warn('[音效] 無法建立音訊，之後不出聲', error)
    ctx = null
    master = null
  }
  return ctx
}

/** 在使用者手勢裡呼叫：建立（或恢復）音訊。iPad Safari 要播一段無聲才算真的解鎖。 */
export function unlockAudio(): void {
  const c = ensureContext()
  if (!c) return
  if (c.state !== 'running') {
    c.resume().catch(() => {
      // 沒恢復成功就等下一次點擊再試
    })
  }
  if (!silentPlayed) {
    silentPlayed = true
    try {
      const src = c.createBufferSource()
      src.buffer = c.createBuffer(1, 1, 22050)
      src.connect(c.destination)
      src.start(0)
    } catch {
      // 舊瀏覽器不支援也沒關係，resume 通常就夠了
    }
  }
}

/** 掛在整頁：每次點擊或按鍵都確認音訊是開著的（iPad 被來電等打斷後也能恢復）。回傳拆除函式。 */
export function installAudioUnlock(target: Document = document): () => void {
  const events = ['pointerdown', 'touchend', 'keydown'] as const
  const handler = () => unlockAudio()
  for (const e of events) target.addEventListener(e, handler, { capture: true, passive: true })
  return () => {
    for (const e of events) target.removeEventListener(e, handler, { capture: true })
  }
}

export function playSfx(name: SfxName): void {
  const { soundOn, volume } = useSettingsStore.getState()
  if (!soundOn || volume <= 0) return
  if (!ctx || !master) return // 還沒點過畫面，依規定不能出聲
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  try {
    const now = ctx.currentTime
    master.gain.setValueAtTime(volume * MASTER_SCALE, now)
    for (const tone of RECIPES[name]) {
      const start = now + tone.start
      const end = start + tone.dur
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = tone.type
      osc.frequency.setValueAtTime(tone.freq, start)
      if (tone.endFreq) osc.frequency.exponentialRampToValueAtTime(tone.endFreq, end)
      // 起音 10 毫秒、指數收尾，避免喀一聲
      env.gain.setValueAtTime(0.0001, start)
      env.gain.linearRampToValueAtTime(tone.gain, start + 0.01)
      env.gain.exponentialRampToValueAtTime(0.0001, end)
      osc.connect(env)
      env.connect(master)
      osc.start(start)
      osc.stop(end + 0.02)
    }
  } catch (error) {
    console.warn(`[音效] 播放 ${name} 失敗`, error)
  }
}

/** 只給測試用：丟掉目前的音訊，回到「還沒點過」的狀態 */
export function resetAudioForTests(): void {
  ctx = null
  master = null
  silentPlayed = false
}
