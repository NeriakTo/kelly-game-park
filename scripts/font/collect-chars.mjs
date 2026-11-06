// 收集站上會顯示的所有字，給字型子集用（也給 src/assets/fonts/font.test.ts 檢查覆蓋率用）。
// 來源：src/ 底下 .ts/.tsx 的字串與 JSX 文字（不含測試檔），用 TypeScript 編譯器解析，
// 不靠正規表示式猜；再加 index.html 的文字與 ASCII 可見字元（數字、英文、標點）。
//
// 用法：node scripts/font/collect-chars.mjs > chars.txt

import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')

function sourceFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'test') continue
      out.push(...sourceFiles(p))
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(p)
    }
  }
  return out
}

function textsInFile(file) {
  const code = readFileSync(file, 'utf8')
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, false, kind)
  const texts = []
  const visit = (node) => {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      case ts.SyntaxKind.TemplateHead:
      case ts.SyntaxKind.TemplateMiddle:
      case ts.SyntaxKind.TemplateTail:
      case ts.SyntaxKind.JsxText:
        texts.push(node.text)
        break
      default:
        break
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return texts
}

/** 回傳排序過、不重複的字（字串），只含要畫出來的字：去掉換行、定位字元等控制字元 */
export function collectSiteChars(root = ROOT) {
  const chars = new Set()
  const add = (text) => {
    for (const ch of text) {
      if (/[\p{Cc}\p{Cf}]/u.test(ch)) continue
      chars.add(ch)
    }
  }
  for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCharCode(c))
  for (const file of sourceFiles(join(root, 'src'))) for (const t of textsInFile(file)) add(t)
  const html = readFileSync(join(root, 'index.html'), 'utf8').replace(/<[^>]*>/g, ' ')
  add(html)
  return [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(collectSiteChars())
}
