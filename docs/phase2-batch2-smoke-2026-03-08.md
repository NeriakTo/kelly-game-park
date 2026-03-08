# Kelly Game Park — Phase 2 第二批優化 Smoke Test

日期：2026-03-08

## 1) 建置驗證

```bash
npm run build
```

結果：✅ 通過

- `dist/index.html`
- `dist/assets/index-DNGf-idE.css`
- `dist/assets/index-CHmMMZ3D.js`

## 2) AI 題目來源 UX

### 數學挑戰
- 已顯示題目來源：
  - AI 成功：`AI`
  - AI 啟用但失敗：`本地題庫（AI 暫不可用，自動回退）`
  - 未啟用 AI：`本地題庫`

### 恐龍商店
- 已顯示題目來源：
  - AI 成功：`AI`
  - AI 啟用但失敗：`本地題庫（AI 暫不可用，自動回退）`
  - 未啟用 AI：`本地題庫`

## 3) 文件同步

- `README.md`
  - 難度改為 5 段（國小低/中/高、國中、高中）
  - 補上 Phase 2 AI 題目模式與 fallback 行為

- `PROJECT_PLAN.md`
  - 新增 `Phase 2 進度更新（2026-03-08）`
  - 記錄第一批完成項與第二批優化項

## 4) 建議下一步（Phase 2.3）

1. 加入 AI 逾時控制（例如 3~5 秒）避免慢回應覆蓋體驗。
2. 對 AI 回傳做更嚴格 schema 檢查（特別是 options/answer 一致性）。
3. 增加 e2e smoke（無 key / 有 key / provider error 三情境）。
