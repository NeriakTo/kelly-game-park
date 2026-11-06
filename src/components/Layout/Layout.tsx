import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Hills } from '../art/scenery'

// 全站外框：只放背景山丘與唯一一份頁面內容（Outlet）。
// 頂列由各頁自己放：首頁是站名＋聲音＋家長鎖，遊戲頁是回首頁＋遊戲名＋聲音＋怎麼玩。
// 以前桌機側欄、平板上方選單、手機底部九個項目的導覽都拿掉了；小孩只靠首頁卡片與「回首頁」移動。
export default function Layout() {
  return (
    <>
      <Hills />
      <div className="app-page">
        {/* 遊戲頁、家長區、收藏冊是分開載入的，下載完成前先顯示簡單的載入文字 */}
        <Suspense fallback={<p className="py-16 text-center text-moss">載入中…</p>}>
          <Outlet />
        </Suspense>
      </div>
    </>
  )
}
