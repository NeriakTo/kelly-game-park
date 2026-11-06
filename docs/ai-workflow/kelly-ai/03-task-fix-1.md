---
title: 悅悅遊戲公園 AI 服務：第 2 輪修正題目
date: 2026-11-06
task: kelly-ai
base: 435e70b
---

# 第 2 輪修正題目

先讀 `02-主控收貨紀錄.md` 第三節，再照本題修。規格 `00-spec` 仍有效。

## 一、要修的三項

1. **逾時判斷**：`server/src/app.ts` 改用 SDK 匯出的錯誤類別做 `instanceof`（`APIConnectionTimeoutError`），不要比對 `name`。測試要用 SDK 真的錯誤類別 `new APIConnectionTimeoutError()` 丟出，期望 504 `timeout`。
2. **商店選項要打亂**：選項補上答案、去重、截到 6 個以內後，用 Fisher–Yates 打亂。亂數來源預設 `crypto.randomInt`，可從 `createApp` 的相依注入，測試用固定序列。測試：
   - 固定序列下，答案不在第一個位置的情況至少一條。
   - 用預設亂數跑 60 次，答案出現的位置至少有 3 種。
   - 打亂後仍包含答案、不重複、2～6 個。
3. **提示不得寫出答案**：
   - 系統提示加上：提示只引導想法（例如先算哪一步、可以用什麼方法），不得寫出最後答案，也不得寫出最後一步算出的結果。
   - 系統提示再加上：題目要能自然地用一個數字回答；不適合單一數字的單元（例如分數），改問可以用一個數字回答的問題（例如「分成幾份」「吃了幾份」），不要要求孩子「只填某一部分」。
   - 伺服器檢查：答案的數字以獨立數字出現在提示裡（前後不是數字或小數點），**而且**沒有以獨立數字出現在題目文字裡，就當成不合格，回 502 `upstream`。數學的題目文字是 `text`、商店是 `description`。
   - 測試：提示「所以是 92」、題目沒有 92 → 502；答案 1、提示含「1 份」、題目也含「1 份」→ 200；答案 24、提示含「124」→ 不算洩漏 → 200。

## 二、規則

- 每項先 commit 測試（訊息標「先寫，尚未實作」），跑一次留失敗輸出 `out/fix1-<N>-red.txt`，再 commit 實作並留 `out/fix1-<N>-green.txt`。三項各自交替，不要合成一個 commit。
- 改壞檢查：三項各改壞一次（改回比對 `name`、不打亂、拿掉提示檢查），確認至少一條測試失敗，輸出存 `out/fix1-mutation-<N>.txt`，存完還原。
- 只准改 `server/src/**`、`server/test/**`、`docs/ai-workflow/kelly-ai/**`。不安裝套件、不連網路、不執行 docker、不改 `src/` 與 `.github/`。
- 不讀 `~/.claude/projects/`、`~/TriclawKM/`、`.env*`、鑰匙圈；不執行 `triclaw memory`、`triclaw wiki`；不得再派分身；停程序只停自己的 PID，禁止 `pkill`、`killall`。
- 驗收：重跑 `00-task-spec.md` 第十節全部指令（冒煙測試也要），通過數只能增加。

## 三、交付

在 `01-施工報告.md` 末尾加「第 2 輪修正」一節：三項的改法與程式位置、紅綠燈與改壞結果、驗收指令表。報告與輸出都要 commit，`git status` 要乾淨。

最後輸出（繁體中文）：STATUS、SUMMARY、COMMITS、TESTS、NEXT。
