import { useProgressStore } from '../../stores/progressStore'
import { GAMES } from '../../data/games'
import { LEVEL_LABEL } from '../../data/levels'
import BigButton from '../../components/UI/BigButton'
import { PlayIcon } from '../../components/art/icons'
import { ContinueThumb } from '../../components/art/gameArt'

// 繼續上次的遊戲：記得最後玩的遊戲與關卡，點「繼續玩」直接回到那一關。
// 還沒玩過時改成邀請去下棋（悅悅最常玩的）。

export default function ContinueBanner() {
  const last = useProgressStore((s) => s.lastPlayed)
  const shownGame = last?.game ?? 'chess'

  return (
    <section className="home-cont" aria-label="繼續上次的遊戲">
      <span className="tape tape-peach" aria-hidden="true" />
      <div className={`mini ${shownGame === 'chess' || shownGame === 'go' ? 'mini-board' : ''}`} aria-hidden="true">
        <ContinueThumb game={shownGame} />
      </div>
      {last ? (
        <>
          <div className="txt">
            <div className="kicker">繼續上次的遊戲</div>
            <div className="what">
              {GAMES[last.game].name}・{LEVEL_LABEL[last.level]}
            </div>
          </div>
          <BigButton to={`/${last.game}/${last.level}`} variant="primary" icon={<PlayIcon />}>
            繼續玩
          </BigButton>
        </>
      ) : (
        <>
          <div className="txt">
            <div className="kicker">今天第一次來嗎？</div>
            <div className="what">從下棋開始吧</div>
          </div>
          <BigButton to="/chess" variant="primary" icon={<PlayIcon />}>
            去下棋
          </BigButton>
        </>
      )}
    </section>
  )
}
