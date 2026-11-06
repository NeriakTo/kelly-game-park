"""把字型縮成只含站上用到的字，輸出 woff2，並改掉內部字型名稱。

原字型：jf open 粉圓 2.1（justfont/open-huninn-font，SIL OFL 1.1）。
OFL 規定改過的版本（子集也算）不能再用保留字型名稱（open huninn、huninn，以及 Varela、Varela Round），
所以名稱表裡的字型名稱（第 1、3、4、6、16 號）改成 YueyueRound；版權（0）、授權說明（13）、
授權網址（14）原樣保留，網頁字型照 OFL 帶著授權資訊。

用法（需要 fonttools 與 brotli）：
  node scripts/font/collect-chars.mjs > /tmp/chars.txt
  python -I scripts/font/subset-font.py --src jf-openhuninn-2.1.ttf --chars /tmp/chars.txt \
      --out src/assets/fonts/YueyueRound-subset.woff2
"""

import argparse
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

NEW_FAMILY = "YueyueRound"
NEW_POSTSCRIPT = "YueyueRound-Regular"
RENAMED_IDS = {
    1: NEW_FAMILY,
    3: f"{NEW_FAMILY};Regular;subset-of-2.1",
    4: NEW_FAMILY,
    6: NEW_POSTSCRIPT,
    16: NEW_FAMILY,
}
# 這些名稱記錄含保留名稱或原廠識別，子集版不再沿用（商標聲明、廠商網址、字型範例句）
DROPPED_IDS = {7, 11, 19}
RESERVED = ("huninn", "粉圓", "varela")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--src", required=True, help="原字型 ttf")
    parser.add_argument("--chars", required=True, help="要保留的字（UTF-8 文字檔）")
    parser.add_argument("--out", required=True, help="輸出的 woff2")
    args = parser.parse_args()

    with open(args.chars, encoding="utf-8") as f:
        text = f.read()

    font = TTFont(args.src)
    cmap = font.getBestCmap()
    wanted = sorted({ord(c) for c in text})
    missing = [cp for cp in wanted if cp not in cmap]

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.hinting = False
    options.notdef_outline = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=wanted)
    subsetter.subset(font)

    name = font["name"]
    name.names = [r for r in name.names if r.nameID not in DROPPED_IDS]
    for record in name.names:
        if record.nameID in RENAMED_IDS:
            record.string = RENAMED_IDS[record.nameID]
    if "CFF " in font:
        print("這個字型是 CFF 外框，CFF 內的字型名稱也要改；目前不支援", file=sys.stderr)
        return 1

    for record in name.names:
        if record.nameID in RENAMED_IDS or record.nameID == 2 or record.nameID == 17:
            value = record.toUnicode().lower()
            if any(r in value for r in RESERVED):
                print(f"名稱 {record.nameID} 還含保留名稱：{value}", file=sys.stderr)
                return 1

    font.flavor = "woff2"
    font.save(args.out)
    kept = len(wanted) - len(missing)
    print(f"保留 {kept} 字，原字型沒有的 {len(missing)} 字交給系統字型：" + "".join(chr(c) for c in missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
