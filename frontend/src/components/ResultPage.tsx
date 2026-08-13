import type { AnalyzeResponse } from '../types'
import ReplyCard from './ReplyCard'

interface Props {
  result: AnalyzeResponse
  onContinue: () => void
  onBackToList: () => void
  onSwapSides: () => void
}

export default function ResultPage({
  result,
  onContinue,
  onBackToList,
  onSwapSides,
}: Props) {
  const profile = result.crush_profile_update

  return (
    <div className="page">
      {/* 结论 */}
      <section className="bg-gradient-to-br from-brand to-brand-light rounded-2xl p-5 text-white mb-5">
        <h1 className="text-xl font-bold mb-2">读心结果</h1>
        <p className="text-lg leading-relaxed">{result.conclusion}</p>
      </section>

      {/* 军师思考 */}
      <section className="bg-white rounded-2xl p-4 mb-4">
        <h2 className="text-base font-semibold mb-2">🧠 我为什么这么觉得</h2>
        <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">
          {result.reasoning_short}
        </p>
      </section>

      {/* 回复建议 */}
      <section className="mb-4">
        <h2 className="text-base font-semibold mb-2">💬 这几句可以直接发</h2>
        <p className="text-xs text-ink-muted mb-3">按你想要的力度选一句。</p>
        <div className="space-y-3">
          {result.replies.map((r) => (
            <ReplyCard key={r.type} reply={r} />
          ))}
        </div>
      </section>

      {/* crush 档案 */}
      <section className="bg-white rounded-2xl p-4 mb-4">
        <h2 className="text-base font-semibold mb-2">📋 TA 的档案</h2>
        {profile.latest_status && (
          <p className="text-sm text-ink mb-1.5">
            <span className="text-ink-muted">当前状态：</span>
            {profile.latest_status}
          </p>
        )}
        {profile.crush_traits?.length > 0 && (
          <p className="text-sm text-ink mb-1.5">
            <span className="text-ink-muted">TA 特征：</span>
            {profile.crush_traits.join('、')}
          </p>
        )}
        {profile.user_risk?.length > 0 && (
          <p className="text-sm text-ink">
            <span className="text-ink-muted">你的风险：</span>
            {profile.user_risk.join('、')}
          </p>
        )}
      </section>

      {/* 翻车预警 */}
      <section className="bg-warn/10 border border-warn/30 rounded-2xl p-4 mb-6">
        <h2 className="text-base font-semibold mb-2">⚠️ 这句先别发</h2>
        <p className="text-sm text-ink line-through mb-1">{result.dont_send.text}</p>
        <p className="text-xs text-ink-muted">原因：{result.dont_send.reason}</p>
      </section>

      <button
        type="button"
        onClick={onContinue}
        className="btn-touch w-full rounded-2xl bg-brand text-white text-base font-semibold mb-3"
      >
        对方回了吗？接着读 🔮
      </button>

      <button
        type="button"
        onClick={onBackToList}
        className="btn-touch w-full rounded-2xl border border-brand text-brand text-base font-semibold"
      >
        回列表
      </button>

      <button
        type="button"
        onClick={onSwapSides}
        className="w-full text-center text-xs text-ink-muted mt-4 underline"
      >
        气泡识别错了？切换双方重新分析
      </button>
    </div>
  )
}
