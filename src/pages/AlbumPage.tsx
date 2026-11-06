import { useMemo } from 'react'
import { TopBar, Spacer, BackHomeButton } from '../components/UI/TopBar'
import BigButton from '../components/UI/BigButton'
import { AlbumArt } from '../components/art/gameArt'
import { FossilArt } from '../components/art/fossilArt'
import { Songsong } from '../components/art/scenery'
import { loadCollection, countFossilPieces } from '../games/dino-shop/collection'
import type { DinoFossil } from '../games/dino-shop/types'

// 我的收藏冊：列出在恐龍商店收集到的化石。資料只讀恐龍商店存的收藏，不另外存。

function fossilLabel(f: DinoFossil): string {
  const got = Math.min(f.collectedPieces, f.totalPieces)
  if (got >= f.totalPieces) return `${f.dinoName}，${f.totalPieces} 片都找到了，完成！`
  if (got === 0) return `${f.dinoName}，還沒找到`
  return `${f.dinoName}，找到 ${got} 片，還差 ${f.totalPieces - got} 片`
}

function FossilCard({ fossil }: { fossil: DinoFossil }) {
  const got = Math.min(fossil.collectedPieces, fossil.totalPieces)
  const done = got >= fossil.totalPieces
  const state = done ? 'done' : got > 0 ? 'some' : 'none'
  return (
    <li aria-label={fossilLabel(fossil)} className="album-card">
      <div aria-hidden="true" className="flex w-full flex-col items-center gap-2">
        <FossilArt dinoId={fossil.dinoId} state={state} className="h-24 w-32" />
        <div className="text-[22px]">{fossil.dinoName}</div>
        <div className="flex gap-1.5">
          {Array.from({ length: fossil.totalPieces }, (_, i) => (
            <span key={i} className={`piece ${i < got ? 'piece-on' : ''}`} />
          ))}
        </div>
        <div className={`text-[17px] ${done ? 'text-pine-d' : 'text-moss'}`}>
          {done ? '完成！' : `${got} / ${fossil.totalPieces} 片`}
        </div>
      </div>
    </li>
  )
}

export default function AlbumPage() {
  const data = useMemo(() => loadCollection(), [])
  const pieces = countFossilPieces(data)
  const finished = data.fossils.filter((f) => f.collectedPieces >= f.totalPieces).length

  return (
    <>
      <TopBar>
        <BackHomeButton />
        <AlbumArt className="hidden h-12 w-12 flex-none sm:block" />
        <h1 className="topbar-title">我的收藏冊</h1>
        <Spacer />
      </TopBar>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
        <section className="sheet sheet-paper flex-row flex-wrap items-center gap-4 p-5">
          <Songsong className="h-[118px] w-[100px] flex-none" shadow="#EBD3AE" />
          {pieces > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="m-0 text-[24px]">一共找到 {pieces} 片化石</p>
              <p className="m-0 text-moss">
                在恐龍商店答對 {data.totalCorrect} 題・拼好 {finished} 隻恐龍
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="m-0 text-[22px]">收藏冊還是空的。去恐龍商店答對題目，就能挖到化石！</p>
              <BigButton to="/dino-shop" variant="primary">去恐龍商店</BigButton>
            </div>
          )}
        </section>
        <ul aria-label="化石收藏" className="album-grid">
          {data.fossils.map((f) => (
            <FossilCard key={f.dinoId} fossil={f} />
          ))}
        </ul>
      </main>
    </>
  )
}
