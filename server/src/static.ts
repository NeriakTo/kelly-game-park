import { readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
export const security = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY' }
export const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.txt': 'text/plain; charset=utf-8',
}
export function safePath(path: string) {
  return !path.includes('\0') && !path.replaceAll('\\', '/').split('/').includes('..')
}
export function staticFile(dir: string, path: string) {
  const root = realpathSync(dir)
  let file = resolve(root, '.' + path)
  try { if (!statSync(file).isFile()) file = resolve(root, 'index.html') }
  catch { file = resolve(root, 'index.html') }
  const real = realpathSync(file)
  if (!real.startsWith(root + sep)) throw new Error('outside static root')
  return { status: 200, headers: { ...security, 'content-type': mime[extname(file)] ?? 'application/octet-stream', 'cache-control': extname(file) === '.html' ? 'no-store' : path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' }, body: readFileSync(real) }
}
