# Hetzner 部署交接

本次僅交付部署檔，未執行 Docker、Cloudflare 設定或任何外部連線。請先完成前端 API 改接並審查，再由主控部署。前端仍是原本瀏覽器直連模型的版本。

## 首次部署

1. 在 Hetzner 放置審查通過的倉庫版本，記錄 commit。主機先備妥 Docker Compose 與既有 Cloudflare tunnel。
2. 建立 `/opt/kellygames/data`，擁有者設為容器 `node` 的 UID/GID（官方 Node 映像為 1000:1000），僅此目錄可持久寫入。目錄須讓 `node` 能建立暫存檔並 rename。
3. 在倉庫之外由主控建立 `/opt/kellygames/secrets.env`，限制為主控帳號可讀，勿提交版本控制。
4. 在倉庫根目錄先保留目前可用映像：`docker image tag kellygames:local kellygames:rollback`（首次無舊映像時略過）。執行 `docker compose -f deploy/hetzner/compose.yml build`，再執行 `docker compose -f deploy/hetzner/compose.yml up -d --no-build`。
5. 主機以 `/healthz`、網站 `/`、正確與錯誤通行碼的 status 確認；需要實際模型驗證時由主控授權後測一題，會消耗每日額度。檢查容器健康狀態與 JSON 紀錄，不輸出秘密。
6. 設定 Cloudflare 通道（如下）後檢查正式站台。正式站仍須完成前端改接才會使用此後端。

`secrets.env` 變數名稱（僅列名稱，不提供值）：

- 必填：`ANTHROPIC_API_KEY`、`FAMILY_PASSCODE_SHA256`。
- 選填：`ANTHROPIC_WORKSPACE_ID`、`AI_MODEL`、`DAILY_LIMIT`。
- 容器已設定，通常不必覆寫：`PORT`、`DATA_DIR`、`STATIC_DIR`。

通行碼雜湊必須是 SHA-256 的 64 位十六進位字串；不要把明文通行碼放進映像或前端。預設模型 `claude-haiku-5-5`、每日上限 300，主控部署時須確認帳號有模型與工作區權限。資料檔損壞會停止啟動，勿為了恢復服務刪掉 `usage.json` 歸零；先備份並核對。此服務僅支援單程序、單容器共用一份額度檔，勿平行擴容。SDK 按規格保留一次重試，每個 API 出題呼叫預扣一次額度，SDK 內部重試也可能產生額外上游流量；此上限不是供應商帳單的硬上限。

## Cloudflare 通道

在既有通道的 ingress 最終 404 規則之前加入：

```yaml
- hostname: kellygames.nerigate.dev
  service: http://127.0.0.1:3020
```

由主控設定對應 DNS 通道路由並重新載入既有通道設定，保留其他 hostname 與最後的 404 規則。通道程序須在主機上才能使用上述 loopback 位址。若通道也在容器中，不可直接沿用此位址；需先由主控確認網路設計。

來源限流信任 `CF-Connecting-IP`，因此不可對外開放 3020，亦不可讓其他不受信任的本機服務轉送任意此標頭。公開網站可直接瀏覽，AI 僅透過 `X-Family-Passcode` 使用。未設定雜湊時 AI 全關；有雜湊但沒金鑰時，status 可驗證通行碼並回 `enabled: false`，出題回 503。

## 退回

1. 保留容器紀錄並備份 `/opt/kellygames/data/usage.json`，備份含日期以便核對，不移除原檔。
2. 若本次首次部署失敗：`docker compose -f deploy/hetzner/compose.yml down`，移除或退回這次新增的 hostname 規則與 DNS；不要動其他通道。
3. 若已有舊版：`docker image tag kellygames:rollback kellygames:local`，執行 `docker compose -f deploy/hetzner/compose.yml up -d --no-build --force-recreate`，驗證健康與網站。映像保留舊版前後端，不另外建置新程式。額度檔繼續沿用，不能退回舊計數。
4. GitHub Pages 工作流程及預設 base 都未改；如需暫回原站，依原本 DNS／通道紀錄退回，由主控操作。

## 後續

- Docker 建置、256 MB 記憶體限制下執行、掛載權限與真實模型可用性均須在部署主機驗證。
- CSP 本次未設定，前端完成改接後再評估。
- `/healthz` 只驗存活，不代表模型與資料儲存可用；需搭配 status、出題結果與容器紀錄。
