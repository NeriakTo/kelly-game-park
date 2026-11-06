---
title: 悅悅遊戲公園：前端改接伺服器 AI 服務（施工題目）
date: 2026-11-06
base: e9a74c5
---

# 前端改接伺服器 AI 服務

## 一、背景

Kevin 2026-11-06 決定：網站搬到 Hetzner（`kellygames.nerigate.dev`），AI 改由伺服器呼叫 Claude，金鑰只放伺服器；網站公開，AI 功能要家長在家長區輸入一次「家用通行碼」。伺服器已完成並併入本 branch（`server/`，合約見 `docs/ai-workflow/kelly-ai/00-task-spec.md` 第三節，注意事項見 `docs/ai-workflow/kelly-ai/02-主控收貨紀錄.md` 最後一節）。本次只改前端，**`server/`、`Dockerfile`、`deploy/` 一行都不改**。

## 二、範圍

1. `src/services/ai.ts`：
   - 拿掉 OpenAI 與 Gemini 的呼叫與連線測試。
   - 出題改呼叫 `${import.meta.env.BASE_URL}api/ai/math` 與 `.../api/ai/shop`，帶標頭 `X-Family-Passcode`，本文照合約欄位（不得多欄位）：數學送 `gradeBand`、`unitId`、`unitName`（1～20 字）、`unitDescription`（0～60 字）、`curriculumTag`、`difficulty`（整數 1～5，由關卡換算）、`weakPoints`（選填，最多 5 個，每個 1～30 字）；商店送 `stage`、`difficulty`、`weakPoints`。超過長度的先截斷。
   - 用戶端逾時 8 秒。任何非 200、逾時、網路錯誤、回傳格式不對，一律安靜改用本機題目，孩子畫面不顯示任何錯誤或來源。
   - 分數與時間單元（`unitId` 含 `fraction` 或 `time`）不呼叫 AI，直接用本機題目。
   - 沒有通行碼或家長區關掉 AI 出題時，不呼叫伺服器。
2. 型別與設定：`AIConfig` 改成只有通行碼；持久化的設定要升版並在遷移時**刪掉舊的 `provider` 與 `apiKey`**（舊金鑰不能繼續留在瀏覽器裡）。
3. 家長區 AI 區：
   - 拿掉服務選單與金鑰欄位，換成「家用通行碼」輸入框（只接受英數字與 `-`，8～64 字，輸入時遮住、可切換顯示）、「儲存」與「檢查」兩個按鈕。
   - 「檢查」呼叫 `GET api/ai/status`：200 且 `enabled` 為真，顯示「通行碼正確，今天還能出 N 題」；200 但 `enabled` 為假，顯示「AI 服務目前沒有開」；401 顯示「通行碼不對」；429 `locked` 顯示「錯太多次，請 15 分鐘後再試」；其他（含 404，例如 GitHub 舊站沒有 AI 服務）顯示「這個網址沒有 AI 服務」。
   - 開關（數學挑戰用 AI 出題、恐龍商店用 AI 出題、讓 AI 陪孩子下棋、陪玩時講解每一步）照舊保留；說明文字改成不提金鑰與供應商。
4. 其他頁面若還提到 OpenAI、Gemini、金鑰，一併改掉。

## 三、測試（先寫會失敗的，再實作）

- 出題：呼叫正確網址、帶通行碼標頭、本文欄位符合合約且沒有多的欄位；回 502、503、429、逾時都改用本機題目且畫面沒有錯誤字樣；分數與時間單元不呼叫伺服器；沒通行碼不呼叫。
- 遷移：舊設定裡有 `apiKey` 與 `provider`，升版後讀回沒有這兩個欄位，`localStorage` 原文也搜不到舊金鑰字串。
- 家長區：「檢查」的五種結果各一條（用假的 `fetch`）。
- 改壞檢查兩項：遷移不刪舊金鑰、失敗時把錯誤顯示給孩子，各確認至少一條測試失敗，輸出存檔後還原。

## 四、驗收

照第一階段的驗收指令全部重跑（`npm ci`、`npm run build`、`npm test`、`npx tsc --noEmit -p .`、截圖腳本、`git diff --check b31af4e HEAD`），另加：

```
(cd server && npm test)
VITE_BASE=/ npm run build
git diff --stat e9a74c5 HEAD -- server Dockerfile deploy .github
```

最後一條必須沒有輸出。截圖補一張改版後的家長區 AI 區（直式 820×1180）。

## 五、限制

- 只改 `src/**`、`scripts/check-screens.mjs`（如需新增截圖）、`docs/ai-workflow/kelly-p1/**`。
- 不讀 `~/.claude/` 底下任何東西（包括你自己的對話紀錄）、`~/TriclawKM/`、任何 `.env*`、鑰匙圈與憑證檔。題目不清楚就停下來問主控，不要去翻紀錄。
- 不連外網、不安裝或升級套件；不得再派分身；停程序只停自己啟動的 PID，禁止 `pkill`、`killall`。
- 一個邏輯改動一個 commit，訊息繁體中文 `{type}({scope}): {description}`；不 push、不動 main。

## 六、交付

施工報告 `docs/ai-workflow/kelly-p1/05-施工報告-前端改接AI服務.md`：改了哪些檔、遷移怎麼做、測試清單與先失敗的原因、改壞檢查結果、驗收指令表、截圖路徑。報告與輸出都要 commit，`git status` 要乾淨。
