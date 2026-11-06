import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { useSettingsStore } from '../stores/settingsStore'
import { installAudioUnlock, playSfx, resetAudioForTests } from './sfx'

// 聲音：預設開、音量小；右上角一鍵靜音；音量與開關存在設定裡（重新開網頁還在）。
// 音效用 Web Audio 即時合成，iPad Safari 要在第一次點擊後才建立音訊。

const SETTINGS_KEY = 'kelly-game-park-settings'

// 假的 AudioContext：記下建立了幾次、放了幾個聲音、主音量多大
const audio = { contexts: 0, oscillators: 0, resumed: 0, masterGain: [] as number[] }

class FakeParam {
  value = 0
  setValueAtTime(v: number) { this.value = v; return this }
  linearRampToValueAtTime(v: number) { this.value = v; return this }
  exponentialRampToValueAtTime(v: number) { this.value = v; return this }
}
class FakeNode {
  connect() { return this }
  disconnect() {}
}
class FakeGain extends FakeNode { gain = new FakeParam() }
class FakeOsc extends FakeNode {
  type = 'sine'
  frequency = new FakeParam()
  start() {}
  stop() {}
}
class FakeAudioContext {
  state = 'suspended'
  currentTime = 0
  destination = new FakeNode()
  constructor() { audio.contexts += 1 }
  private masterMade = false
  createGain() {
    const g = new FakeGain()
    // 每個音訊只有第一個建立的增益節點是主音量，只記它
    if (!this.masterMade) {
      this.masterMade = true
      const original = g.gain.setValueAtTime.bind(g.gain)
      g.gain.setValueAtTime = (v: number) => { audio.masterGain.push(v); return original(v) }
    }
    return g
  }
  createOscillator() { audio.oscillators += 1; return new FakeOsc() }
  createBuffer() { return {} }
  createBufferSource() { return Object.assign(new FakeNode(), { buffer: null, start() {} }) }
  resume() { audio.resumed += 1; this.state = 'running'; return Promise.resolve() }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

function savedSettings() {
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').state ?? {}
}

describe('聲音設定', () => {
  beforeEach(() => {
    useSettingsStore.setState({ soundOn: true, volume: 0.35 })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('測試中不得連外'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('預設是開著的，音量小（不超過 0.4）', () => {
    useSettingsStore.persist.clearStorage()
    const fresh = useSettingsStore.getInitialState()
    expect(fresh.soundOn).toBe(true)
    expect(fresh.volume).toBeGreaterThan(0)
    expect(fresh.volume).toBeLessThanOrEqual(0.4)
  })

  it('首頁右上角一鍵靜音，再按一次打開；開關存進設定', () => {
    renderAt('/')
    const btn = screen.getByRole('button', { name: /^聲音：開/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(btn)
    expect(useSettingsStore.getState().soundOn).toBe(false)
    expect(savedSettings().soundOn).toBe(false)
    const off = screen.getByRole('button', { name: /^聲音：關/ })
    expect(off.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(off)
    expect(savedSettings().soundOn).toBe(true)
  })

  it('遊戲頁頂列也有同一個聲音開關', async () => {
    renderAt('/memory')
    await screen.findByRole('navigation', { name: '選關卡' }, { timeout: 5000 })
    fireEvent.click(screen.getByRole('button', { name: /^聲音：開/ }))
    expect(useSettingsStore.getState().soundOn).toBe(false)
  })

  it('音量與開關重新開網頁後還在', async () => {
    useSettingsStore.getState().setVolume(0.6)
    useSettingsStore.getState().setSoundOn(false)
    expect(savedSettings()).toMatchObject({ volume: 0.6, soundOn: false })

    // 模擬重新開網頁：記憶體裡的值先改掉，再從本機儲存讀回來。
    // setState 也會順手寫進本機儲存，所以改完要把「重新開網頁前」存的內容放回去再讀
    const before = localStorage.getItem(SETTINGS_KEY) ?? ''
    useSettingsStore.setState({ soundOn: true, volume: 0.35 })
    localStorage.setItem(SETTINGS_KEY, before)
    await useSettingsStore.persist.rehydrate()
    expect(useSettingsStore.getState()).toMatchObject({ volume: 0.6, soundOn: false })
  })

  it('音量只收 0 到 1', () => {
    useSettingsStore.getState().setVolume(3)
    expect(useSettingsStore.getState().volume).toBe(1)
    useSettingsStore.getState().setVolume(-1)
    expect(useSettingsStore.getState().volume).toBe(0)
  })
})

describe('音效 API（Web Audio 即時合成）', () => {
  let uninstall: () => void = () => {}

  beforeEach(() => {
    audio.contexts = 0
    audio.oscillators = 0
    audio.resumed = 0
    audio.masterGain = []
    vi.stubGlobal('AudioContext', FakeAudioContext)
    resetAudioForTests()
    useSettingsStore.setState({ soundOn: true, volume: 0.35 })
    uninstall = installAudioUnlock()
  })

  afterEach(() => {
    uninstall()
    resetAudioForTests()
    vi.unstubAllGlobals()
  })

  it('第一次點擊之前不建立音訊（iPad Safari 的規定），點了之後才建立並啟動', () => {
    playSfx('tap')
    expect(audio.contexts).toBe(0)
    expect(audio.oscillators).toBe(0)

    fireEvent.pointerDown(document.body)
    expect(audio.contexts).toBe(1)
    expect(audio.resumed).toBeGreaterThanOrEqual(1)

    playSfx('correct')
    expect(audio.oscillators).toBeGreaterThan(0)
  })

  it('四種音效都能播：點擊、答對、答錯、過關', () => {
    fireEvent.pointerDown(document.body)
    for (const name of ['tap', 'correct', 'wrong', 'win'] as const) {
      const before = audio.oscillators
      playSfx(name)
      expect(audio.oscillators, name).toBeGreaterThan(before)
    }
  })

  it('靜音時完全不出聲', () => {
    fireEvent.pointerDown(document.body)
    useSettingsStore.getState().setSoundOn(false)
    playSfx('win')
    expect(audio.oscillators).toBe(0)
  })

  it('主音量跟著設定的音量走（音量 0.6 是 0.2 的三倍）', () => {
    fireEvent.pointerDown(document.body)
    useSettingsStore.getState().setVolume(0.2)
    playSfx('tap')
    const low = audio.masterGain[audio.masterGain.length - 1]
    useSettingsStore.getState().setVolume(0.6)
    playSfx('tap')
    const high = audio.masterGain[audio.masterGain.length - 1]
    expect(low).toBeGreaterThan(0)
    expect(low).toBeLessThanOrEqual(0.2)
    expect(high / low).toBeCloseTo(3, 5)
  })

  it('瀏覽器沒有 Web Audio 時不會出錯', () => {
    vi.stubGlobal('AudioContext', undefined)
    resetAudioForTests()
    fireEvent.pointerDown(document.body)
    expect(() => playSfx('tap')).not.toThrow()
  })
})
