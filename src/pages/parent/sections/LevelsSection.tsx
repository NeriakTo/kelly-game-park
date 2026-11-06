import { useSettingsStore } from '../../../stores/settingsStore'
import { GAMES, GAME_IDS } from '../../../data/games'
import { LEVELS, LEVEL_LABEL, type Level } from '../../../data/levels'
import { LEVEL_PARENT_NOTE } from '../../../data/levelMap'
import Section from './Section'

// 各遊戲難度：孩子每次進遊戲都會自己選簡單、普通、挑戰；家長可以替每個遊戲指定一個推薦關卡，
// 選關畫面會在那一關貼上「爸媽推薦」。下面一併列出三段各代表什麼。

const CHOICES: readonly (Level | null)[] = [null, ...LEVELS]

export default function LevelsSection() {
  const recommended = useSettingsStore((s) => s.recommendedLevels)
  const setRecommended = useSettingsStore((s) => s.setRecommendedLevel)

  return (
    <Section
      title="各遊戲難度"
      note="孩子每次進遊戲會自己選簡單、普通、挑戰。這裡可以替每個遊戲指定推薦關卡，選關畫面會標上「爸媽推薦」。"
    >
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {GAME_IDS.map((game) => {
          const current = recommended[game] ?? null
          return (
            <li key={game} className="rounded-2xl bg-mist p-3">
              <div className="mb-2 text-[22px]">{GAMES[game].name}</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`${GAMES[game].name}的推薦關卡`}>
                {CHOICES.map((choice) => (
                  <button
                    key={choice ?? 'none'}
                    type="button"
                    aria-pressed={current === choice}
                    onClick={() => setRecommended(game, choice)}
                    className={`min-h-12 min-w-[72px] rounded-full px-4 text-[18px] ${current === choice ? 'bg-lake text-white' : 'bg-paper text-ink'}`}
                  >
                    {choice ? LEVEL_LABEL[choice] : '不指定'}
                  </button>
                ))}
              </div>
              <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 p-0 text-[16px] text-moss">
                {LEVELS.map((level) => (
                  <li key={level}>
                    {LEVEL_LABEL[level]}：{LEVEL_PARENT_NOTE[game][level]}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
