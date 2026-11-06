// 截圖檢查：對建置後的站（vite preview）在四種寬度拍首頁、家長區、選關畫面、一個遊戲頁，
// 並自動檢查三件事：
//   1. 沒有橫向捲動（整頁寬度不超過視窗）
//   2. 可點的東西至少 48×48（遊戲內部畫面第二階段才改，只列出來參考、不算失敗）
//   3. 遊戲元件只掛一份（遊戲頁正好一個 [data-game-root]，其他頁沒有）
//
// 用全域安裝的 Playwright，不加進專案相依：
//   NODE_PATH=$(npm root -g) node scripts/check-screens.mjs
// 截圖存到 docs/ai-workflow/kelly-p1/shots/，檢查結果另存 shots/report.json。
// 只停自己啟動的 vite preview（用它的 PID），不用 pkill。

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs/ai-workflow/kelly-p1/shots')
const PORT = 4179
const BASE = `http://127.0.0.1:${PORT}/kelly-game-park/`
const MIN_TARGET = 48

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'ipad-portrait', width: 820, height: 1180, touch: true },
  { name: 'ipad-landscape', width: 1180, height: 820, touch: true },
  { name: 'laptop', width: 1280, height: 800, touch: false },
]

// 進度資料：讓首頁的「繼續上次的遊戲」與星星有內容（像玩過幾次的樣子）
const PLAYED = {
  'kelly-game-park-progress': {
    state: {
      bestStars: { chess: { easy: 3, normal: 1 }, memory: { easy: 2 }, math: { easy: 3, normal: 2 } },
      lastPlayed: { game: 'chess', level: 'normal', at: '2026-11-06T09:00:00.000Z' },
    },
    version: 0,
  },
}

const PAGES = [
  { name: 'home', hash: '#/', seed: PLAYED, waitFor: 'main.home' },
  { name: 'home-first-visit', hash: '#/', seed: {}, waitFor: 'main.home', only: ['ipad-portrait'] },
  { name: 'parent-gate', hash: '#/parent', seed: {}, waitFor: '[aria-label="按住 3 秒進入家長區"]' },
  { name: 'parent', hash: '#/parent', seed: PLAYED, unlock: true, waitFor: 'text=學習紀錄' },
  { name: 'level-picker', hash: '#/chess', seed: PLAYED, waitFor: 'nav[aria-label="選關卡"]' },
  { name: 'game-chess', hash: '#/chess/easy', seed: PLAYED, waitFor: '[data-game-root]', game: true },
  { name: 'album', hash: '#/album', seed: {}, waitFor: 'ul[aria-label="化石收藏"]' },
]

function ensureBuild() {
  if (existsSync(join(ROOT, 'dist/index.html'))) return
  console.log('找不到 dist/，先建置一次')
  const r = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' })
  if (r.status !== 0) throw new Error('建置失敗')
}

async function startPreview() {
  const child = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stderr.on('data', (d) => process.stderr.write(d))
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(BASE)
      if (res.ok) return child
    } catch {
      // 還沒起來
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  child.kill('SIGTERM')
  throw new Error('vite preview 10 秒內沒有起來')
}

async function inspect(page) {
  return page.evaluate((min) => {
    const doc = document.documentElement
    const horizontal = { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth }
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role="button"], [role="switch"], [role="link"]'
    const small = []
    const smallInGame = []
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue
      if (r.width >= min && r.height >= min) continue
      const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || el.tagName).trim().slice(0, 40)
      const item = { label, w: Math.round(r.width), h: Math.round(r.height) }
      if (el.closest('[data-game-root]')) smallInGame.push(item)
      else small.push(item)
    }
    return {
      horizontal,
      small,
      smallInGame,
      gameRoots: document.querySelectorAll('[data-game-root]').length,
      font: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    }
  }, MIN_TARGET)
}

async function main() {
  ensureBuild()
  mkdirSync(OUT, { recursive: true })
  const server = await startPreview()
  const browser = await chromium.launch()
  const results = []
  let failures = 0

  try {
    for (const vp of VIEWPORTS) {
      for (const p of PAGES) {
        if (p.only && !p.only.includes(vp.name)) continue
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          hasTouch: vp.touch,
          reducedMotion: 'reduce',
        })
        await context.addInitScript(
          ({ seed, unlock }) => {
            if (sessionStorage.getItem('__seeded')) return
            sessionStorage.setItem('__seeded', '1')
            localStorage.clear()
            for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v))
            if (unlock) localStorage.setItem('kelly-game-park-parent-unlock', String(Date.now() + 600000))
          },
          { seed: p.seed, unlock: Boolean(p.unlock) },
        )
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', (e) => errors.push(String(e)))
        await page.goto(BASE + p.hash)
        await page.locator(p.waitFor).first().waitFor({ timeout: 10000 })
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(150)

        const info = await inspect(page)
        const file = `${p.name}-${vp.width}x${vp.height}.png`
        await page.screenshot({ path: join(OUT, file), fullPage: true })

        const problems = []
        if (info.horizontal.scrollWidth > info.horizontal.innerWidth) {
          problems.push(`橫向捲動：頁寬 ${info.horizontal.scrollWidth} > 視窗 ${info.horizontal.innerWidth}`)
        }
        for (const s of info.small) problems.push(`可點元素太小：「${s.label}」${s.w}×${s.h}`)
        const expectRoots = p.game ? 1 : 0
        if (info.gameRoots !== expectRoots) problems.push(`遊戲元件掛了 ${info.gameRoots} 份（應為 ${expectRoots}）`)
        for (const e of errors) problems.push(`頁面錯誤：${e}`)

        failures += problems.length
        results.push({ viewport: `${vp.width}x${vp.height}`, page: p.name, file, problems, smallInGame: info.smallInGame, fonts: [...new Set(info.font)] })
        const mark = problems.length === 0 ? '通過' : '失敗'
        console.log(`${mark}  ${vp.width}x${vp.height}  ${p.name}${info.smallInGame.length ? `（遊戲內部 ${info.smallInGame.length} 個小於 48，第二階段處理）` : ''}`)
        for (const msg of problems) console.log(`      ${msg}`)
        await context.close()
      }
    }
  } finally {
    await browser.close()
    server.kill('SIGTERM')
  }

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(results, null, 2) + '\n')
  console.log(`\n共 ${results.length} 張截圖，${failures === 0 ? '全部通過' : `${failures} 個問題`}；截圖在 docs/ai-workflow/kelly-p1/shots/`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
