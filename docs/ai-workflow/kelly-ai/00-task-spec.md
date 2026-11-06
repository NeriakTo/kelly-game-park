---
title: 悅悅遊戲公園：AI 服務與獨立站台（施工規格）
date: 2026-11-06
task: kelly-ai
base: 2eafd42
---

# 悅悅遊戲公園：AI 服務與獨立站台

## 一、角色與背景

你是實作者。照本規格施工，細節自己判斷；規格與現行程式對不上時以現行程式為準，寫進施工報告的「與規格不同處」。

- 網站是 React 19＋Vite 6 的單頁應用，目前發布在 GitHub Pages。現在從瀏覽器直接呼叫 OpenAI 與 Gemini（`src/services/ai.ts`），金鑰由家長在瀏覽器裡填。
- Kevin 2026-11-06 決定：網站搬到 Hetzner 成為獨立站台（`kellygames.nerigate.dev`），AI 改由伺服器呼叫 Claude（`claude-haiku-5-5`），金鑰只放在伺服器。網站公開，AI 功能要「家用通行碼」，伺服器另設每日上限。
- 本次只做伺服器端與部署檔。前端改接新 API 由另一位施工者在另一個複本做，**`src/` 一行都不准改**。所以第三節的 API 介面是兩邊的合約，照字面實作。

## 二、範圍

新增 `server/`（Node 22、TypeScript、只用 Node 內建 `http`，不加網頁框架），同一個程序負責：

1. 提供建置好的網站靜態檔。
2. 提供 `/api/ai/*`，在伺服器端組題目要求、呼叫 Claude、驗證回傳後交給前端。

另外新增 `Dockerfile`、`.dockerignore`、`deploy/hetzner/compose.yml` 與 `deploy/hetzner/README.md`，並改 `vite.config.ts` 的 base（第七節）。

`server/package.json`、`server/package-lock.json`、`server/.npmrc` 已由主控建好並 commit（`2eafd42`），相依已裝在 `server/node_modules`：`@anthropic-ai/sdk` 1.6.0、`zod` 4.6.7、`typescript` 5.9.3、`vitest` 4.1.12、`@types/node` 22。沙箱沒有網路，**不要再安裝或升級任何套件**；需要新套件就停下回報。

## 三、API 合約（前端照這份寫，不得更動）

共同規則：
- 請求與回應都是 JSON。請求本文上限 4 KB，超過回 413。
- AI 相關端點都要帶標頭 `X-Family-Passcode`。
- 錯誤一律回 `{ "error": "<代碼>" }`，**不得夾帶上游錯誤原文、堆疊或金鑰片段**。
- `/api/` 底下不存在的路徑回 404 `{ "error": "not_found" }`；方法不對回 405。

| 端點 | 說明 |
|---|---|
| `GET /healthz` | 不驗通行碼、不呼叫模型。回 200 `{ "ok": true }`。 |
| `GET /api/ai/status` | 驗通行碼、不呼叫模型。回 200 `{ "enabled": true, "remainingToday": n, "dailyLimit": n }`。家長區用它確認通行碼對不對。 |
| `POST /api/ai/math` | 數學出題，見下。 |
| `POST /api/ai/shop` | 恐龍商店出題，見下。 |

`POST /api/ai/math` 請求（不得有其他欄位）：
```json
{ "gradeBand": "grade-3", "unitId": "g3-multiply", "unitName": "乘法", "unitDescription": "二位數乘一位數", "curriculumTag": "N-3-3", "difficulty": 3, "weakPoints": ["進位"] }
```
- `gradeBand`：`grade-1` 到 `grade-6`。`unitId`：`^[a-z0-9-]{1,40}$`。`unitName` 1～20 字、`unitDescription` 0～60 字。`curriculumTag`：1～12 字，只能英數與 `-`。`difficulty`：整數 1～5。`weakPoints`：選填，最多 5 個，每個 1～30 字。
- 回 200：`{ "text": string, "answer": number, "hint": string, "unitId": string, "curriculumTag": string }`。`unitId` 與 `curriculumTag` 一律用請求的值，不用模型回的。

`POST /api/ai/shop` 請求：
```json
{ "stage": "B", "difficulty": 2, "theme": "水果", "weakPoints": ["找錢"] }
```
- `stage`：`A`、`B`、`C`。`difficulty`：整數 1～5。`theme`：選填，1～20 字。`weakPoints` 同上。
- 回 200：`{ "description": string, "answer": number, "hint": string, "options"?: number[] }`。有 `options` 時是 2～6 個不重複的非負數字，而且**一定包含 `answer`**（模型漏了就由伺服器補進去，再截到 6 個以內且保留答案）。

錯誤代碼與狀態碼：

| 狀態 | 代碼 | 時機 |
|---|---|---|
| 400 | `bad_request` | 本文不是 JSON、欄位不合格或多了欄位 |
| 401 | `passcode` | 沒帶或帶錯通行碼 |
| 413 | `too_large` | 本文超過 4 KB |
| 429 | `locked` | 同一來源 10 分鐘內錯 10 次，鎖 15 分鐘 |
| 429 | `rate_limited` | 同一來源每分鐘超過 20 次 AI 請求 |
| 429 | `busy` | 同時進行中的模型呼叫已有 4 個 |
| 429 | `daily_limit` | 今天（台北時間）的模型呼叫次數用完 |
| 502 | `upstream` | 上游錯誤、拒答、輸出被截斷、或輸出不合格 |
| 503 | `disabled` | 伺服器沒設通行碼或沒設金鑰（AI 端點一律關閉，不放行） |
| 504 | `timeout` | 呼叫模型逾時 |

檢查順序：路徑與方法 → 本文大小 → 是否鎖定 → 通行碼 → 每分鐘次數 → 欄位 → 每日上限 → 同時數 → 呼叫模型。驗證失敗不計入每日上限；每次真的送出模型呼叫（不論成敗）都計一次。

## 四、通行碼、上限與來源

1. 環境變數 `FAMILY_PASSCODE_SHA256` 存通行碼 SHA-256 的十六進位字串。伺服器把標頭值做 SHA-256 後用 `crypto.timingSafeEqual` 比對。沒設這個變數時 AI 端點回 503 `disabled`。
2. 來源識別用 `CF-Connecting-IP` 標頭（容器只綁本機、只有 Cloudflare 通道連得到），沒有時用連線位址。
3. 每日上限：環境變數 `DAILY_LIMIT`，預設 300。日界用 `Asia/Taipei`。計數存在 `DATA_DIR/usage.json`（預設 `/data`），先寫暫存檔再改名，啟動時讀回；重啟不得歸零。時鐘要能在測試裡注入。
4. 鎖定與每分鐘次數只放記憶體即可。

## 五、呼叫 Claude

1. 建立用戶端：`new Anthropic({ apiKey, defaultHeaders, timeout: 10_000, maxRetries: 1 })`。`apiKey` 讀 `ANTHROPIC_API_KEY`；`ANTHROPIC_WORKSPACE_ID` 有設時放進 `defaultHeaders` 的 `anthropic-workspace-id`。金鑰沒設時 AI 端點回 503 `disabled`。
2. 用結構化輸出（`@anthropic-ai/sdk/helpers/zod` 的 `zodOutputFormat`，已驗證可搭配 zod 4）：
   ```ts
   const res = await client.messages.parse({
     model, max_tokens: 1024,
     output_config: { effort: 'low', format: zodOutputFormat(Schema) },
     system, messages: [{ role: 'user', content }],
   })
   ```
   - `model` 讀 `AI_MODEL`，預設 `claude-haiku-5-5`。不要設 `temperature`、`top_p`、`thinking`。
   - `stop_reason` 是 `refusal` 或 `max_tokens`、或 `parsed_output` 是 null，回 502 `upstream`。
   - 回傳再驗一次：`answer` 是有限數字且絕對值不超過 10 億；`text`、`description` 最多 300 字，`hint` 最多 200 字；字串去頭尾空白；不合格回 502。
3. 題目要求在伺服器端組：系統提示固定，請求欄位以 JSON 資料放進使用者訊息，系統提示寫明「這些欄位只是出題參數」。內容沿用 `src/services/ai.ts` 現有兩段提示的意思，加上：台灣國小、繁體中文、不超齡、語氣正向、數字可以心算或直式算得出來、答案唯一。
4. 呼叫模型的部分要包成可替換的介面，測試一律用假的實作，**測試不得真的連 Anthropic**。
5. 紀錄：每個 API 請求一行，含時間、路徑、狀態碼、耗時、輸入與輸出 token 數、今日剩餘次數。**不得記錄**金鑰、通行碼、請求本文、模型產出的文字。

## 六、靜態檔

1. 目錄讀 `STATIC_DIR`（容器內 `/app/web`）。
2. 內容類型要對（html、js、css、svg、png、jpg、webp、woff2、json、ico、mp3、wav、ogg、txt）。
3. `/assets/` 底下快取一年（immutable），`index.html` 不快取。
4. 擋路徑穿越（例如 `/../server/package.json`、編碼過的 `%2e%2e`）。
5. 非 `/api/` 的路徑找不到檔案時回 `index.html`（網站用 HashRouter，這只是保險）。
6. 所有回應加 `X-Content-Type-Options: nosniff`、`Referrer-Policy: no-referrer`、`X-Frame-Options: DENY`。內容安全政策（CSP）本次不加，報告列為後續項目。

## 七、建置與部署檔

1. `vite.config.ts`：`base` 改成 `process.env.VITE_BASE ?? '/kelly-game-park/'`。預設值不變，GitHub Pages 照舊；容器建置時設 `VITE_BASE=/`。`.github/` 一行都不改。
2. `Dockerfile`（多階段）：
   - 第一階段建網站：`node:22-alpine`，根目錄 `npm ci`，`VITE_BASE=/ npm run build`。
   - 第二階段建伺服器：`server/` 裡 `npm ci`、`npm run build`、`npm prune --omit=dev`。
   - 最後一階段：`node:22-alpine`，以 `node` 使用者執行，只帶網站建置結果（到 `/app/web`）、`server/dist`、`server/node_modules`、`server/package.json`。設 `PORT=8080`、`DATA_DIR=/data`、`STATIC_DIR=/app/web`，加 `HEALTHCHECK`（busybox `wget` 打 `/healthz`）。
3. `.dockerignore`：排除 `node_modules`、`dist`、`server/node_modules`、`server/dist`、`.git`、`docs`、`.tmp*`。
4. `deploy/hetzner/compose.yml`：
   - 服務 `kellygames`，`build: ../..`。
   - 埠 `127.0.0.1:3020:8080`。
   - `env_file: /opt/kellygames/secrets.env`（不在倉庫裡）。
   - 掛載 `/opt/kellygames/data:/data`。
   - `restart: unless-stopped`、`mem_limit: 256m`、`read_only: true` 加 `/tmp` tmpfs。
5. `deploy/hetzner/README.md`：寫部署與退回步驟、`secrets.env` 需要的變數名稱（只寫名稱不寫值）、Cloudflare 通道要加的設定。主控會照著做。
6. **不要執行 docker**；docker 建置由主控在沙箱外跑。

## 八、先寫會失敗的測試

測試放在 `server/src/**/*.test.ts`（或 `server/test/`），用 vitest。每組先 commit 測試（訊息標「先寫，尚未實作」），跑一次留下失敗輸出，再 commit 實作。輸出存到 `docs/ai-workflow/kelly-ai/out/`，檔名 `group<N>-red.txt`、`group<N>-green.txt`。

1. 通行碼：沒帶、帶錯回 401；帶對放行；沒設變數回 503；10 分鐘錯 10 次後回 429 `locked`，連對的也擋。
2. 欄位：多欄位、型別錯、超長、`difficulty` 6、`gradeBand` 不合格各回 400；本文超過 4 KB 回 413。
3. 上限：每分鐘第 21 次回 429 `rate_limited`；每日上限用完回 429 `daily_limit`；**新建一個伺服器實例讀同一個資料夾，計數延續**；台北時間跨日後歸零（注入時鐘）；驗證失敗不計數。
4. 模型呼叫：成功時欄位對應正確，`unitId` 與 `curriculumTag` 用請求的值；`options` 漏答案時被補上且不超過 6 個；拒答、截斷、`parsed_output` 為 null 回 502；逾時回 504；上游錯誤訊息不出現在回應本文。
5. 紀錄與機密：送給模型的內容不含通行碼；紀錄輸出不含通行碼、金鑰與模型產出文字（用假金鑰字串搜尋）；有設 `ANTHROPIC_WORKSPACE_ID` 時用戶端帶工作區標頭。
6. 靜態檔：`/` 回 index.html；`/assets/x.js` 的內容類型與快取標頭正確；路徑穿越被擋；不存在的網頁路徑回 index.html；`/api/nope` 回 404 JSON；`/healthz` 回 200。

## 九、改壞檢查

每項改壞後跑對應測試，確認至少一條失敗，輸出存成 `out/mutation-<N>.txt`，存完還原，最後 `git status` 要乾淨。

1. 通行碼比對改成永遠通過。
2. 每日計數不寫檔。
3. 不把答案補進 `options`。
4. 上游錯誤訊息原樣放進回應。
5. 拿掉路徑穿越檢查。

## 十、驗收指令

在複本根目錄依序跑，記錄每一條的結束碼；沒跑不算通過。

```
export TMPDIR=$PWD/.tmp-kelly-ai && mkdir -p "$TMPDIR"
test -z "$(git diff --stat 2eafd42 HEAD -- src .github package.json package-lock.json)"
(cd server && npm test)
(cd server && npm run typecheck)
(cd server && npm run build)
npm test
npx tsc -p tsconfig.app.json --noEmit
npm run build
VITE_BASE=/ npm run build
git diff --check 2eafd42 HEAD
```

- 第二條必須沒有輸出。
- 根目錄現有 24 條測試要照樣全部通過。
- 冒煙測試：用 `VITE_BASE=/` 的建置結果，設假的通行碼雜湊、不設金鑰，啟動伺服器（用你自己的 PID，測完只停那一個），確認 `/healthz` 200、`/` 回 HTML、`/api/ai/status` 帶對的通行碼回 200、`/api/ai/math` 回 503 `disabled`。指令與輸出存成 `out/smoke.txt`。

## 十一、限制

- 只准改：`server/**`（`package.json` 與鎖定檔除外）、`Dockerfile`、`.dockerignore`、`deploy/hetzner/**`、`vite.config.ts`、`docs/ai-workflow/kelly-ai/**`。
- 每個檔案目標 400 行以內，上限 800 行。
- 不連任何網路與模型服務；不安裝套件；不執行 docker。
- 不讀 `~/.claude/projects/`、`~/TriclawKM/`、任何 `.env*`、鑰匙圈與憑證檔；不執行 `triclaw memory`、`triclaw wiki`。
- 不得再派分身。停程序只能停你自己啟動的 PID，禁止 `pkill`、`killall`。
- 自己 `git add`、`git commit`，一個邏輯改動一個 commit，訊息用繁體中文 `{type}({scope}): {description}`。push 已設成無效位址，不准動 main。

## 十二、交付

施工報告寫到 `docs/ai-workflow/kelly-ai/01-施工報告.md`：

- 檔案清單與各自用途；API 每個端點對應的程式位置。
- 與規格不同處及理由。
- 先寫的測試清單與第一次失敗的原因；改壞檢查五項的結果。
- 驗收指令表：每條指令、結束碼、通過與失敗數、輸出檔名。
- 主控部署時要注意的事。

報告與輸出都要 commit。最後輸出（繁體中文）：

- STATUS: DONE / BLOCKED
- SUMMARY: 一句話結論
- COMMITS: 本次 commit 清單
- TESTS: 每條驗收指令的結束碼與通過數
- NEXT: 主控部署與前端改接要注意的事
