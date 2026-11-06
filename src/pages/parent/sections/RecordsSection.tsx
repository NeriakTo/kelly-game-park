import { useMemo, useState } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { gameName } from '../../../data/games'
import { LEVEL_LABEL } from '../../../data/levels'
import { GRADE_UNITS, type Grade } from '../../../games/math/generators'
import { loadUnitStats, loadWrongBook, unitStatus } from '../../../games/math/records'
import type { GameScore } from '../../../types'
import Section from './Section'

// 學習紀錄：原本設定頁的遊戲統計（改成中文遊戲名），加上原本在數學畫面上的學習地圖（課綱代碼、
// 各單元正確率）與錯題本。這些都是給大人看的，所以只放在家長區。

const GRADES: readonly Grade[] = [1, 2, 3, 4, 5, 6]

function scoreGroupLabel(s: GameScore): string {
  const where = s.level ? LEVEL_LABEL[s.level] : `舊版難度 ${s.difficulty}`
  return `${gameName(s.gameType)}・${where}`
}

function bestByGroup(scores: readonly GameScore[]) {
  const map = new Map<string, { best: number; plays: number }>()
  for (const s of scores) {
    const key = scoreGroupLabel(s)
    const prev = map.get(key) ?? { best: 0, plays: 0 }
    map.set(key, { best: Math.max(prev.best, s.score), plays: prev.plays + 1 })
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-Hant'))
}

export default function RecordsSection() {
  const scores = useGameStore((s) => s.scores)
  const settingsGrade = useSettingsStore((s) => s.grade)
  const [grade, setGrade] = useState<Grade>(settingsGrade)
  const unitStats = useMemo(() => loadUnitStats(), [])
  const wrongBook = useMemo(() => loadWrongBook(), [])
  const groups = bestByGroup(scores)

  const units = GRADE_UNITS[grade].map((u) => {
    const key = `${grade}-${u.id}`
    const stat = unitStats[key]
    return { ...u, attempts: stat?.attempts ?? 0, ...unitStatus(stat), wrongs: wrongBook[key] ?? [] }
  })
  const wrongTotal = units.reduce((n, u) => n + u.wrongs.length, 0)

  return (
    <Section title="學習紀錄">
      <h3 className="m-0 text-[22px] font-normal">各遊戲成績</h3>
      <p className="m-0 text-moss">一共玩了 {scores.length} 次</p>
      {groups.length === 0 ? (
        <p className="m-0 text-moss">還沒有遊戲紀錄。</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {groups.map(([label, g]) => (
            <li key={label} className="flex flex-wrap justify-between gap-2 border-b border-leaf py-1">
              <span>{label}</span>
              <span className="text-moss">最高 {g.best} 分・玩了 {g.plays} 次</span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="m-0 mt-3 text-[22px] font-normal">數學各單元</h3>
      <div className="flex flex-wrap gap-2" role="group" aria-label="看哪個年級的紀錄">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={grade === g}
            onClick={() => setGrade(g)}
            className={`min-h-12 min-w-12 rounded-full px-4 text-[18px] ${grade === g ? 'bg-lake text-white' : 'bg-leaf text-ink'}`}
          >
            {g} 年級
          </button>
        ))}
      </div>
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
        {units.map((u) => (
          <li key={u.id} className="rounded-2xl bg-mist p-3">
            <div className="flex items-center justify-between gap-2">
              <span>{u.name}</span>
              <span className="rounded-full bg-paper px-3 text-[16px]">{u.status}</span>
            </div>
            <div className="text-[16px] text-moss">課綱 {u.curriculumTag}</div>
            <div className="text-[17px]">作答 {u.attempts} 次・正確率 {u.acc}%・錯題 {u.wrongs.length} 題</div>
          </li>
        ))}
      </ul>
      <details className="rounded-2xl bg-mist p-3">
        <summary className="min-h-12 cursor-pointer py-2">{grade} 年級錯題本（{wrongTotal} 題）</summary>
        {wrongTotal === 0 ? (
          <p className="m-0 text-moss">這個年級沒有錯題。</p>
        ) : (
          <ul className="m-0 flex flex-col gap-1 pl-5">
            {units.flatMap((u) =>
              u.wrongs.map((p, i) => (
                <li key={`${u.id}-${i}`}>
                  {p.text}（答案 {p.answer}；{u.name}）
                </li>
              )),
            )}
          </ul>
        )}
      </details>
    </Section>
  )
}
