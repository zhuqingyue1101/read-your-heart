import type { Session } from '../types'

interface Props {
  sessions: Session[]
  onNew: () => void
  onOpen: (session: Session) => void
  onDelete: (id: string) => void
  onHistory: (session: Session) => void
  onSettings: () => void
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} 天前`
  return new Date(ts).toLocaleDateString()
}

export default function SessionListPage({
  sessions,
  onNew,
  onOpen,
  onDelete,
  onHistory,
  onSettings,
}: Props) {
  return (
    <div className="page">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">读心 💘</h1>
          <p className="text-sm text-ink-muted mt-1">你正在撩的每一条线，都帮你记着</p>
        </div>
        <button
          type="button"
          onClick={onSettings}
          className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-ink-muted"
          aria-label="设置"
        >
          ⚙️
        </button>
      </header>

      <button
        type="button"
        onClick={onNew}
        className="btn-touch w-full rounded-2xl bg-brand text-white text-base font-semibold mb-5"
      >
        ＋ 新建会话
      </button>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <span className="text-5xl mb-4">💌</span>
          <p className="text-base font-semibold mb-1">还没有会话</p>
          <p className="text-sm text-ink-muted">上传第一张和 crush 的聊天截图，开始读心吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="relative bg-white rounded-2xl p-4 shadow-sm cursor-pointer"
              onClick={() => onOpen(s)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`删除「${s.name}」这条会话？`)) onDelete(s.id)
                }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-ink/5 text-ink-muted text-xs flex items-center justify-center"
                aria-label="删除"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-1.5 pr-8">
                <span className="text-base font-semibold">{s.name}</span>
                <span className="text-xs text-brand bg-brand-light/30 px-2 py-0.5 rounded-full">
                  {s.relationship_stage}
                </span>
              </div>

              {s.last_conclusion && (
                <p className="text-sm text-ink leading-relaxed line-clamp-2 mb-2">
                  {s.last_conclusion}
                </p>
              )}

              {s.latest_status && (
                <p className="text-xs text-ink mb-1.5">
                  <span className="text-ink-muted">状态：</span>
                  {s.latest_status}
                </p>
              )}
              {(s.crush_traits?.length ?? 0) > 0 && (
                <p className="text-xs text-ink-muted mb-1 line-clamp-1">
                  TA：{(s.crush_traits ?? []).join('、')}
                </p>
              )}
              {(s.user_risk?.length ?? 0) > 0 && (
                <p className="text-xs text-ink-muted mb-1 line-clamp-1">
                  风险：{(s.user_risk ?? []).join('、')}
                </p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-muted">{formatTime(s.updated_at)}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onHistory(s)
                  }}
                  className="text-xs text-brand"
                >
                  历史记录（{s.records?.length ?? 0}）
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
