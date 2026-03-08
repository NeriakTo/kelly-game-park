# Kelly Game Park — 開發交接文件

> DarkMeow → MeowClaw 交接｜2026-03-08

---

## 專案概覽

- **Repo**: `NeriakTo/kelly-game-park`
- **線上版**: https://neriakto.github.io/kelly-game-park/
- **技術棧**: React 19 + Vite 6 + Tailwind 4 + TypeScript + Zustand
- **部署方式**: GitHub Actions 自動部署（push main → build → deploy-pages）
- **目標用戶**: Kelly（國小二年級、將滿八歲）

---

## 部署管線（⚠️ 重要）

### ✅ 正確方式（已修正）
```
修改 src/ → npm run build（本地驗證）→ git add/commit/push → GitHub Actions 自動部署
```

- Workflow: `.github/workflows/deploy.yml`
- 使用 `actions/deploy-pages@v4`，自動從 `dist/` 部署
- GitHub Pages Source 設定為 **GitHub Actions**（不是 branch/docs）

### ❌ 舊方式（已廢棄，不要用）
- 不要手動複製 build 到 `docs/` 資料夾
- `docs/` 已加入 `.gitignore`
- `dist/` 也在 `.gitignore`（只有 CI 用）

---

## 專案結構

```
src/
├── App.tsx                    # 路由定義
├── main.tsx                   # React 入口
├── index.css                  # Tailwind + 自訂色系
├── types/index.ts             # 共用型別（Difficulty, GameType, AIConfig...）
├── stores/gameStore.ts        # Zustand 全域狀態（profile, scores, aiConfig, aiModes）
├── services/ai.ts             # AI 出題服務（OpenAI / Gemini）
├── components/
│   ├── Layout/Layout.tsx      # 主版面（含 sidebar, difficulty selector）
│   ├── GameCard/GameCard.tsx   # 首頁遊戲卡片
│   └── UI/DifficultySelector  # 難度選擇器
├── pages/                     # 各遊戲的頁面 wrapper
├── games/
│   ├── math/                  # 🧮 數學挑戰（108課綱，6年級）
│   ├── dino-shop/             # 🦕 恐龍商店（商店情境數學）
│   ├── chess/                 # ♟️ 中國象棋
│   ├── go/                    # ⚫ 圍棋教室（課程 + 對弈）
│   ├── sudoku/                # 🔢 數獨
│   ├── memory/                # 🃏 記憶翻牌
│   └── typing/                # ⌨️ 打字練習
└── utils/random.ts
```

---

## 遊戲清單與 AI 支援

| 遊戲 | AI 出題 | AI/本地切換 | 雙人模式 | 備註 |
|------|---------|------------|---------|------|
| 🧮 數學挑戰 | ✅ | ✅ 按鈕 | — | 108課綱，6年級單元，錯題回練 |
| 🦕 恐龍商店 | ✅ | ✅ 按鈕 | — | 商店情境，買賣/找零/比價 |
| ♟️ 中國象棋 | ✅ 內建 AI | ✅ 按鈕 | ✅ 雙人對弈 | 可愛動物棋子 |
| ⚫ 圍棋 | ✅ 內建 AI | ✅ 按鈕 | ✅ 雙人對弈 | 9×9，含 8 堂課程 |
| 🔢 數獨 | ❌ | — | — | 本地生成 |
| 🃏 記憶翻牌 | ❌ | — | — | 本地 |
| ⌨️ 打字練習 | ❌ | — | — | 本地 |

---

## AI 出題架構

### 核心檔案: `src/services/ai.ts`

- 支援 **OpenAI**（gpt-4.1-mini）和 **Google Gemini**（gemini-2.5-flash）
- API Key 存在 `localStorage`（`kelly-game-park-ai`），不進 zustand persist
- 自動從 Key 前綴偵測 provider：`AIza` → Gemini，`sk-` → OpenAI
- 超時 6 秒，失敗自動回退本地題庫
- 設定頁有「⚡ 測試連線」按鈕

### AI 模式切換（aiModes）

- 存在 `gameStore.aiModes`（per-game 記錄）
- 預設：數學/商店 = `local`，象棋/圍棋 = `ai`
- 切換按鈕在各遊戲頂部，切換時自動 reset

### ⚠️ 已知行為
- **每次 reset 後第一題一定是本地**（同步生成，不等 AI）
- 第二題起才用 AI（透過 prefetch 機制）
- `reason: null` 代表「尚未嘗試 AI」，不是錯誤

### 錯誤處理
- 所有 AI 失敗輸出到 `console.warn`（`[AI Math]`、`[AI Shop]`、`[AI Test]`）
- UI 顯示具體 reason label（auth、CORS、timeout、schema 等）
- `normalizeProviderReason()` 從 Error message 抽取分類

---

## 狀態管理重點

### gameStore.ts (Zustand + persist)

```ts
// 持久化欄位
profile: PlayerProfile        // nickname, avatar
scores: GameScore[]           // 歷史成績
currentDifficulty: Difficulty // 1-5（國小低~高中）
aiModes: GameAIModes          // per-game AI/local 切換

// 非持久化（localStorage 分離）
aiConfig: AIConfig | null     // { provider, apiKey }
```

### merge 函式
- persist 的 `merge` 會合併 `aiModes`，確保新增遊戲的 default 不被舊 persist 覆蓋

---

## 我修正的問題（DarkMeow, 2026-03-08）

| Commit | 修正內容 |
|--------|---------|
| `ec1c1e6` | 部署從 docs/ 改為 GitHub Actions；加入 AI/本地切換（math, dino-shop） |
| `a8c9a2a` | 象棋/圍棋加入 AI/本地切換 + 雙人模式 |
| `5d3baa5` | 設定頁加 API 測試按鈕；console.warn 輸出；補齊所有 reason label |
| `5606ce4` | null reason 不再顯示「AI 錯誤：未知」 |

---

## 待處理 / 未來方向

1. **AI 出題第一題也用 AI**：可改為 reset 時先顯示 loading，async 等 AI 回題
2. **商店題型問題**：`compare-prices` 和非二元 `budget-check` 類型被排除 AI（怕答案格式不合），可改善 prompt
3. **Code splitting**：bundle 超過 500KB，可用 `React.lazy()` 分割各遊戲
4. **Supabase 整合**：成績目前只存 localStorage，可接 Supabase 做跨裝置同步
5. **更多遊戲**：Kevin 提過的其他教育遊戲
6. **PWA 支援**：可加 service worker 做離線使用

---

## 開發注意事項

1. **永遠先 `npm run build` 驗證再 push**
2. **不要碰 docs/ 資料夾**（已廢棄）
3. **Tailwind 4 用 CSS-first config**（不是 tailwind.config.js）
4. **自訂色系**在 `src/index.css`（mint, cream, wood, pink-light, sky-light 等）
5. **AI Key 不進 git**，只存瀏覽器 localStorage
6. **GitHub PAT** 在 remote URL 中，2026-05-26 到期
