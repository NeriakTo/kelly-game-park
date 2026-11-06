// 讀 woff2 字型檔裡的字元表（cmap）與名稱表（name），給字型測試用，不需要 Python。
// woff2 的 cmap 與 name 表在壓縮流裡不做轉換，解開 brotli 後照 OpenType 格式讀即可。
// 規格：https://www.w3.org/TR/WOFF2/ 第 4、5 節；OpenType cmap／name 表。

import { readFileSync } from 'node:fs'
import { brotliDecompressSync } from 'node:zlib'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SITE_FONT = join(dirname(fileURLToPath(import.meta.url)), '../../src/assets/fonts/YueyueRound-subset.woff2')

// woff2 表格目錄用 6 位元索引代表常見表名（規格 Table 1）
const KNOWN_TAGS = ('cmap head hhea hmtx maxp name OS/2 post cvt  fpgm glyf loca prep CFF  VORG EBDT EBLC gasp hdmx kern LTSH PCLT VDMX vhea vmtx BASE GDEF GPOS GSUB EBSC JSTF MATH CBDT CBLC COLR CPAL SVG  sbix acnt avar bdat bloc bsln cvar fdsc feat fmtx fvar gvar hsty just lcar mort morx opbd prop trak Zapf Silf Glat Gloc Feat Sill')
  .match(/.{4}\s?/g)
  .map((t) => t.slice(0, 4))

function readBase128(buf, pos) {
  let value = 0
  for (let i = 0; i < 5; i++) {
    const b = buf[pos.at++]
    value = value * 128 + (b & 0x7f)
    if ((b & 0x80) === 0) return value
  }
  throw new Error('woff2：UIntBase128 太長')
}

function tables(file) {
  const buf = readFileSync(file)
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error(`${file} 不是 woff2`)
  const numTables = buf.readUInt16BE(12)
  const compressedLength = buf.readUInt32BE(20)
  const pos = { at: 48 }
  const dir = []
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos.at++]
    const index = flags & 0x3f
    const tag = index === 63 ? buf.toString('latin1', pos.at, (pos.at += 4)) : KNOWN_TAGS[index]
    const version = flags >> 6
    const origLength = readBase128(buf, pos)
    const transformed = tag === 'glyf' || tag === 'loca' ? version !== 3 : version !== 0
    const length = transformed ? readBase128(buf, pos) : origLength
    dir.push({ tag, length })
  }
  const data = brotliDecompressSync(buf.subarray(pos.at, pos.at + compressedLength))
  const out = new Map()
  let offset = 0
  for (const t of dir) {
    out.set(t.tag, data.subarray(offset, offset + t.length))
    offset += t.length
  }
  return out
}

function readCmap(cmap) {
  const count = cmap.readUInt16BE(2)
  const subtables = []
  for (let i = 0; i < count; i++) {
    const r = 4 + i * 8
    subtables.push({ platform: cmap.readUInt16BE(r), encoding: cmap.readUInt16BE(r + 2), offset: cmap.readUInt32BE(r + 4) })
  }
  const pick =
    subtables.find((s) => s.platform === 3 && s.encoding === 10) ?? subtables.find((s) => s.platform === 3 && s.encoding === 1)
  if (!pick) throw new Error('cmap：找不到 Windows Unicode 子表')
  const t = cmap.subarray(pick.offset)
  const format = t.readUInt16BE(0)
  const codes = new Set()
  if (format === 12) {
    const groups = t.readUInt32BE(12)
    for (let g = 0; g < groups; g++) {
      const start = t.readUInt32BE(16 + g * 12)
      const end = t.readUInt32BE(20 + g * 12)
      for (let c = start; c <= end; c++) codes.add(c)
    }
  } else if (format === 4) {
    const segs = t.readUInt16BE(6) / 2
    const ends = 14
    const starts = ends + segs * 2 + 2
    const deltas = starts + segs * 2
    const ranges = deltas + segs * 2
    for (let s = 0; s < segs; s++) {
      const end = t.readUInt16BE(ends + s * 2)
      const start = t.readUInt16BE(starts + s * 2)
      const delta = t.readInt16BE(deltas + s * 2)
      const rangeOffset = t.readUInt16BE(ranges + s * 2)
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let glyph
        if (rangeOffset === 0) glyph = (c + delta) & 0xffff
        else {
          const at = ranges + s * 2 + rangeOffset + (c - start) * 2
          glyph = t.readUInt16BE(at)
          if (glyph !== 0) glyph = (glyph + delta) & 0xffff
        }
        if (glyph !== 0) codes.add(c)
      }
    }
  } else {
    throw new Error(`cmap：不支援格式 ${format}`)
  }
  return codes
}

function readNames(name) {
  const count = name.readUInt16BE(2)
  const storage = name.readUInt16BE(4)
  const records = []
  for (let i = 0; i < count; i++) {
    const r = 6 + i * 12
    const platform = name.readUInt16BE(r)
    const nameID = name.readUInt16BE(r + 6)
    const length = name.readUInt16BE(r + 8)
    const offset = name.readUInt16BE(r + 10)
    const raw = name.subarray(storage + offset, storage + offset + length)
    if (platform !== 3 && platform !== 0) continue
    const chars = []
    for (let j = 0; j + 1 < raw.length; j += 2) chars.push(raw.readUInt16BE(j))
    records.push({ nameID, value: String.fromCharCode(...chars) })
  }
  return records
}

/** 讀字型：回傳它有的字（Unicode 碼位）與名稱表 */
export function readFontInfo(file = SITE_FONT) {
  const t = tables(file)
  const cmap = t.get('cmap')
  const name = t.get('name')
  if (!cmap || !name) throw new Error('woff2：缺少 cmap 或 name 表')
  return { codePoints: readCmap(cmap), names: readNames(name) }
}
