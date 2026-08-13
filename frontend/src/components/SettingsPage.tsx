import type { Session } from '../types'

interface Props {
  sessions: Session[]
  onBack: () => void
  onClearAll: () => void
  onDeleteSession: (id: string) => void
}

export default function SettingsPage({ sessions, onBack, onClearAll, onDeleteSession }: Props) {
  const handleClearAll = () => {
    if (window.confirm('确定清除全部本地数据？所有 crush 档案和历史记录都会被删除，无法恢复。')) {
      onClearAll()
    }
  }

  return (
    <div className="page">
      <header className="mb-5">
        <button type="button" onClick={onBack} className="text-sm text-ink-muted mb-3">
          ← 返回列表
        </button>
        <h1 className="text-2xl font-bold">设置 ⚙️</h1>
      </header>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">数据管理</h2>

        <div className="bg-white rounded-2xl p-4 mb-3">
          <p className="text-sm font-semibold mb-1">删除单个 crush 档案</p>
          <p className="text-xs text-ink-muted mb-3">
            删除后该条关系线的所有历史记录也会一并清除。
          </p>
          {sessions.length === 0 ? (
            <p className="text-sm text-ink-muted">暂无档案</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-ink-muted">
                      {s.relationship_stage} · {s.records?.length ?? 0} 次分析
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`删除「${s.name}」这条档案？`)) onDeleteSession(s.id)
                    }}
                    className="shrink-0 text-xs text-warn px-2.5 py-1 rounded-full border border-warn/40"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          className="btn-touch w-full rounded-2xl border border-warn/50 text-warn text-base font-semibold"
        >
          清除全部本地数据
        </button>
      </section>

      <p className="text-xs text-ink-muted leading-relaxed">
        🔒 所有数据只保存在你的手机浏览器本地，不会上传到服务器。清除后无法恢复。
      </p>
    </div>
  )
}
