import { useState } from 'react'
import type { AnalysisRecord, Session } from '../types'

interface Props {
  session: Session
  onBack: () => void
  onContinue: () => void
  onDeleteRecord: (recordId: string) => void
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

function RecordCard({
  record,
  onDelete,
}: {
  record: AnalysisRecord
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-base font-semibold leading-snug">{record.conclusion}</p>
          <p className="text-xs text-ink-muted mt-1">
            {formatTime(record.created_at)} · {record.relationship_stage} · {record.goal}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('删除这条分析记录？')) onDelete()
          }}
          className="shrink-0 text-xs text-ink-muted px-2 py-1 rounded-full bg-ink/5"
        >
          删除
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-brand"
      >
        {open ? '收起详情 ▲' : '查看详情 ▼'}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {record.reasoning_short && (
            <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">
              <span className="text-ink-muted">🧠 </span>
              {record.reasoning_short}
            </p>
          )}
          <div className="space-y-1.5">
            {record.replies.map((r) => (
              <p key={r.type} className="text-sm text-ink leading-relaxed">
                <span className="text-brand text-xs font-semibold mr-1">[{r.type}]</span>
                {r.text}
              </p>
            ))}
          </div>
          <p className="text-xs text-ink-muted">
            ⚠️ 别发：<span className="line-through">{record.dont_send.text}</span>（{record.dont_send.reason}）
          </p>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage({ session, onBack, onContinue, onDeleteRecord }: Props) {
  const records = [...(session.records ?? [])].sort((a, b) => b.created_at - a.created_at)

  return (
    <div className="page">
      <header className="mb-4">
        <button type="button" onClick={onBack} className="text-sm text-ink-muted mb-3">
          ← 返回列表
        </button>
        <h1 className="text-2xl font-bold">历史记录 💌</h1>
        <p className="text-sm text-ink-muted mt-1">
          「{session.name}」共 {records.length} 次分析
        </p>
      </header>

      <button
        type="button"
        onClick={onContinue}
        className="btn-touch w-full rounded-2xl bg-brand text-white text-base font-semibold mb-5"
      >
        继续读这条线 🔮
      </button>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <span className="text-4xl mb-3">🗂️</span>
          <p className="text-sm text-ink-muted">还没有历史记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <RecordCard key={r.id} record={r} onDelete={() => onDeleteRecord(r.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
