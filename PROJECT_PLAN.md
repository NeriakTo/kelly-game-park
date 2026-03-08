# 🎮 Kelly's Game Park — 專案規劃書

> 為 Kelly（國小二年級、將滿八歲）打造的兒童益智遊戲平台

## 📋 專案概要

## ✅ Phase 2 進度更新（2026-03-08）

- 已完成：
  - 數學挑戰 AI 出題接入（本地先出題，AI 背景覆寫）
  - 恐龍商店 AI 出題接入（保留 coin payment 本地互動）
  - 題目來源標示（AI / 本地題庫）
  - AI 失敗自動 fallback 並維持可玩
  - 難度標籤統一為 5 段（國小低/中/高、國中、高中）
- 第二批優化：
  - README 與規劃文件對齊實作現況
  - 補齊 smoke test 檢核與建置驗證


| 項目 | 說明 |
|------|------|
| 專案名稱 | Kelly's Game Park |
| 目標用戶 | 國小～高中學生（主要：Kelly，8歲） |
| 部署方式 | GitHub Pages（靜態站，零伺服器成本） |
| 技術棧 | React 19 + Vite + TypeScript + Tailwind CSS |
| 資料儲存 | Supabase（成績記錄、排行榜） |
| AI 功能 | 使用者自帶 API Key（OpenAI / Gemini） |

---

## 🎯 核心功能

### Phase 1 — MVP（首批上線）
1. **中國象棋** — AI 對戰 + 難度分級
2. **數獨** — 自動生成題目 + 難度分級
3. **遊戲大廳** — 遊戲選擇、個人資料、成績總覽

### Phase 2 — 擴展遊戲
4. **記憶翻牌** — 圖案配對（低年級友善）
5. **數學挑戰** — 四則運算限時答題
6. **成語接龍** — 中文語文能力訓練
7. **2048** — 數字邏輯思考

### Phase 3 — 進階功能
8. **五子棋 / 圍棋（簡化版）**
9. **英語單字配對**
10. **AI 導師模式** — 用 AI 解釋棋局/解題思路

---

## 🎨 介面設計

### 動物森友會風格
- **色彩**：柔和粉彩（薄荷綠 `#A8D8B9`、鵝黃 `#FFF3CD`、淡粉 `#F8C8DC`、天藍 `#B5D4E8`）
- **字體**：圓體風格（Noto Sans TC Round / M PLUS Rounded 1c）
- **元素**：圓角卡片、小動物 icon、氣泡對話框、星星獎勵動畫
- **音效**：輕快背景音樂 + 操作回饋音（可關閉）
- **Responsive**：手機 / 平板 / 桌機自適應

### 頁面結構
```
/                   → 首頁（遊戲大廳）
/chess              → 中國象棋
/sudoku             → 數獨
/memory-game        → 記憶翻牌
/math-challenge     → 數學挑戰
/settings           → 設定（API Key、Supabase、個人資料）
/leaderboard        → 排行榜
```

---

## 🧩 難度系統

| 等級 | 對應 | 象棋 AI 深度 | 數獨空格數 | 數學範圍 |
|------|------|-------------|-----------|---------|
| ⭐ | 國小低年級（1-2） | 搜尋 1-2 層 | 20-25 格 | 加減（1-20） |
| ⭐⭐ | 國小中年級（3-4） | 搜尋 2-3 層 | 30-35 格 | 加減乘（1-100） |
| ⭐⭐⭐ | 國小高年級（5-6） | 搜尋 3-4 層 | 35-40 格 | 四則運算 |
| ⭐⭐⭐⭐ | 國中 | 搜尋 4-5 層 | 40-50 格 | 含括號、分數 |
| ⭐⭐⭐⭐⭐ | 高中 | 搜尋 5+ 層 | 50-55 格 | 含指數、根號 |

---

## 🔧 技術架構

```
kelly-game-park/
├── public/
│   └── assets/          # 圖片、音效
├── src/
│   ├── components/      # 共用元件
│   │   ├── Layout/      # Header, Sidebar, Footer
│   │   ├── GameCard/    # 遊戲選擇卡片
│   │   └── UI/          # Button, Modal, Stars...
│   ├── games/
│   │   ├── chess/       # 中國象棋引擎 + UI
│   │   ├── sudoku/      # 數獨生成器 + UI
│   │   ├── memory/      # 記憶翻牌
│   │   └── math/        # 數學挑戰
│   ├── hooks/           # 共用 hooks
│   ├── services/
│   │   ├── supabase.ts  # Supabase client
│   │   ├── ai.ts        # AI API 封裝
│   │   └── storage.ts   # localStorage fallback
│   ├── stores/          # Zustand 狀態管理
│   ├── types/           # TypeScript 型別
│   ├── utils/           # 工具函式
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 關鍵技術決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 狀態管理 | Zustand | 輕量、簡單，比 Redux 少 boilerplate |
| 路由 | React Router v7 | SPA 標準方案 |
| 象棋引擎 | 自建 minimax + alpha-beta 剪枝 | 純前端、可控難度 |
| 數獨生成 | 回溯法生成 + 挖洞法控制難度 | 無需外部 API |
| 動畫 | Framer Motion | 與 React 整合最佳 |
| 圖標 | Lucide React | 輕量、可愛風格 |

### 資料儲存策略

**雙軌制：**
1. **localStorage**（預設）— 離線可用，無需登入
2. **Supabase**（可選）— 跨裝置同步、排行榜

使用者可在設定頁選擇是否連接 Supabase。未連接時所有資料存 localStorage。

### Supabase Schema

```sql
-- 使用者
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 遊戲成績
CREATE TABLE game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  game_type TEXT NOT NULL,       -- 'chess', 'sudoku', 'memory', 'math'
  difficulty INT NOT NULL,       -- 1-5
  score INT NOT NULL,
  duration_seconds INT,
  details JSONB,                 -- 遊戲特定數據
  played_at TIMESTAMPTZ DEFAULT now()
);

-- 排行榜 view
CREATE VIEW leaderboard AS
SELECT player_id, game_type, difficulty,
       MAX(score) as best_score,
       COUNT(*) as games_played
FROM game_scores
GROUP BY player_id, game_type, difficulty;
```

### AI 整合

```typescript
// 使用者在設定頁輸入 API Key，存 localStorage（不上傳）
interface AIConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
}

// AI 用途：
// 1. 象棋：分析棋局、建議走法、教學解說
// 2. 數獨：提示解題思路
// 3. 數學：解題步驟講解
// 4. 通用：AI 導師對話
```

---

## 🚀 部署方案

### GitHub Pages + GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Vite 配置（GitHub Pages）
```typescript
export default defineConfig({
  base: '/kelly-game-park/',  // repo 名稱
  // ...
})
```

---

## 📅 開發排程

| 階段 | 內容 | 預估時間 |
|------|------|---------|
| Sprint 1 | 專案初始化 + 大廳 UI + 路由 | Day 1 |
| Sprint 2 | 數獨（生成器 + UI + 難度） | Day 2-3 |
| Sprint 3 | 中國象棋（引擎 + UI + AI 難度） | Day 4-6 |
| Sprint 4 | 記憶翻牌 + 數學挑戰 | Day 7-8 |
| Sprint 5 | Supabase 整合 + 排行榜 | Day 9 |
| Sprint 6 | AI 整合 + 設定頁 | Day 10 |
| Sprint 7 | 測試 + 動畫打磨 + 部署 | Day 11-12 |

---

## ✅ 驗收標準

- [ ] 在瀏覽器直接打開即可玩（GitHub Pages）
- [ ] 手機 / 平板 / 桌機均可正常操作
- [ ] 中國象棋 AI 可正常對弈，5 個難度等級
- [ ] 數獨可生成並驗證解答，5 個難度等級
- [ ] 動物森友會風格 UI，色彩柔和可愛
- [ ] 無需登入即可遊玩（localStorage）
- [ ] 可選連接 Supabase 同步成績
- [ ] AI 功能需使用者自行提供 API Key
- [ ] 零伺服器成本運行
