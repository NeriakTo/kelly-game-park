import { StarIcon } from '../art/icons'

// 三顆星：拿到幾顆就亮幾顆，其餘是虛線空星。文字說明交給外層（卡片的 aria-label）。

export default function Stars({ count, className = '' }: { count: number; className?: string }) {
  return (
    <span className={`stars ${className}`.trim()} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <StarIcon key={i} filled={i < count} />
      ))}
    </span>
  )
}

export function starsText(count: number): string {
  return count > 0 ? `拿到 ${count} 顆星` : '還沒有星星'
}
