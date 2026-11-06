import { useSettingsStore } from '../../../stores/settingsStore'
import type { Grade } from '../../../games/math/generators'
import Section from './Section'

const GRADES: readonly Grade[] = [1, 2, 3, 4, 5, 6]

export default function GradeSection() {
  const grade = useSettingsStore((s) => s.grade)
  const setGrade = useSettingsStore((s) => s.setGrade)

  return (
    <Section title="年級" note="數學挑戰依這個年級出題；換年級後，下次進數學挑戰就是新年級的題目。">
      <div className="flex flex-wrap gap-3">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={grade === g}
            onClick={() => setGrade(g)}
            className={`big-btn ${grade === g ? 'big-btn--primary' : 'big-btn--secondary'} min-w-[112px] px-4`}
          >
            {g} 年級
          </button>
        ))}
      </div>
    </Section>
  )
}
