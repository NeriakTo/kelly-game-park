# 站內字型 YueyueRound（子集）

| 項目 | 內容 |
|---|---|
| 原字型 | jf open 粉圓 2.1（justfont 發行） |
| 取得處 | GitHub `justfont/open-huninn-font` 的 release `v2.1`，檔案 `jf-openhuninn-2.1.ttf` |
| 原檔 SHA-256 | `9d5bf4932d31fe94c18cd8cfddc98bc1b14ce10f4e354c682179db290a99c825` |
| 授權 | SIL Open Font License 1.1，全文見同資料夾 `OFL.txt`（取自該倉庫根目錄的 LICENSE） |
| 本站檔案 | `YueyueRound-subset.woff2`，SHA-256 `d4036a3aa8f761095db381689489475dcf871d29f14ed098a40a099487b80f71`（約 144 KB） |

## 做了什麼修改

1. **子集化**：只留站上實際會顯示的字（目前 795 字，含 ASCII 可見字元與注音）。字表由 `scripts/font/collect-chars.mjs` 從 `src/` 的字串與 JSX 文字、`index.html` 收集。原字型沒有的符號與 emoji 交給系統字型。
2. **改內部字型名稱**：OFL 規定修改過的版本不能再用保留字型名稱（open huninn、huninn，以及 Varela、Varela Round）。名稱表第 1、3、4、6、16 號改成 `YueyueRound`；商標聲明（7）、廠商網址（11）、範例句（19）拿掉；版權（0）、授權說明（13）、授權網址（14）原樣保留在字型裡。
3. 去掉微調指令（hinting），輸出 woff2。

## 重新產生（加了新的字之後）

`src/assets/fonts/font.test.ts` 會檢查站上用到的字都在字型裡；新增畫面文字後這條測試失敗，就照下面重做一次：

```
node scripts/font/collect-chars.mjs > /tmp/chars.txt
python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install fonttools brotli
/tmp/fontenv/bin/python -I scripts/font/subset-font.py \
  --src jf-openhuninn-2.1.ttf --chars /tmp/chars.txt \
  --out src/assets/fonts/YueyueRound-subset.woff2
```

使用者輸入的字（孩子的暱稱）與第二階段 AI 出的題目可能有字不在子集裡，那幾個字會用系統字型顯示。
