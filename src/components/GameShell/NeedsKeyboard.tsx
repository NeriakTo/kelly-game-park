import { useEffect } from 'react'
import BigButton from '../UI/BigButton'
import { Songsong } from '../art/scenery'
import { TypingArt } from '../art/gameArt'

// 打字遊戲在沒接鍵盤的觸控裝置上：友善地請她改用筆電，並給一個大大的回首頁。
// 如果其實有接鍵盤（判斷不準），按任何一個實體按鍵就放行。

export default function NeedsKeyboard({ onKeyboard }: { onKeyboard: () => void }) {
  useEffect(() => {
    const onKey = () => onKeyboard()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onKeyboard])

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-12">
      <section className="sheet sheet-paper items-center gap-4 p-6 text-center sm:p-10">
        <div className="flex items-end justify-center gap-2">
          <Songsong className="h-[154px] w-[130px]" shadow="#BFDCCB" />
          <TypingArt className="h-24 w-24" />
        </div>
        <h2 className="m-0 text-[30px] font-normal">這個遊戲要用筆電玩喔</h2>
        <p className="m-0 text-moss">練打字要用真的鍵盤。請爸爸媽媽幫你打開筆電，再來找松松！</p>
        <p className="m-0 text-[17px] text-moss">已經接上鍵盤了嗎？按鍵盤上任何一個鍵就可以開始。</p>
        <BigButton to="/" variant="primary">回首頁</BigButton>
      </section>
    </main>
  )
}
