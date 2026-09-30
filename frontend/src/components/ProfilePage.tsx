import { useState } from 'react'
import type { CrushProfile, HistoryEvent, Session } from '../types'
import { emptyProfile } from '../store'

interface Props {
  session: Session
  onBack: () => void
  onSave: (profile: CrushProfile) => void
}

export default function ProfilePage({ session, onBack, onSave }: Props) {
  const [profile, setProfile] = useState<CrushProfile>(session.profile ?? emptyProfile())

  const setCrush = (patch: Partial<CrushProfile['crush']>) =>
    setProfile((p) => ({ ...p, crush: { ...p.crush, ...patch } }))
  const setMe = (patch: Partial<CrushProfile['me']>) =>
    setProfile((p) => ({ ...p, me: { ...p.me, ...patch } }))

  const handleSave = () => {
    onSave(profile)
    onBack()
  }

  return (
    <div className="page">
      <header className="mb-5">
        <button type="button" onClick={onBack} className="text-sm text-ink-muted mb-3">
          ← 返回列表
        </button>
        <h1 className="text-2xl font-bold">📋 crush 档案</h1>
        <p className="text-sm text-ink-muted mt-1">
          {session.name} · 记下 TA 的细节，回复会更懂你
        </p>
      </header>

      <section className="mb-5">
        <h2 className="text-base font-semibold mb-2">TA（对方）</h2>
        <div className="space-y-3">
          <TagEditor
            label="兴趣"
            value={profile.crush.interests}
            onChange={(v) => setCrush({ interests: v })}
            placeholder="比如：打游戏、养猫"
          />
          <TagEditor
            label="习惯"
            value={profile.crush.habits}
            onChange={(v) => setCrush({ habits: v })}
            placeholder="比如：晚上回消息慢、爱发语音"
          />
          <TagEditor
            label="重要信息"
            value={profile.crush.important}
            onChange={(v) => setCrush({ important: v })}
            placeholder="比如：下周三生日、最近在找实习"
          />
          <HistoryEditor value={profile.crush.history} onChange={(v) => setCrush({ history: v })} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-2">我（回复偏好）</h2>
        <div className="space-y-3">
          <TagEditor
            label="想要的语气"
            value={profile.me.tone}
            onChange={(v) => setMe({ tone: v })}
            placeholder="比如：幽默一点、别太卑微"
          />
          <TagEditor
            label="忌讳的回复方式"
            value={profile.me.taboos}
            onChange={(v) => setMe({ taboos: v })}
            placeholder="比如：不发小作文、不连环追问"
          />
          <TagEditor
            label="常用口头禅"
            value={profile.me.catchphrases}
            onChange={(v) => setMe({ catchphrases: v })}
            placeholder="比如：哈哈、笑死"
          />
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        className="btn-touch w-full rounded-2xl bg-brand text-white text-base font-semibold"
      >
        保存档案
      </button>
    </div>
  )
}

function TagEditor({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim()
    setInput('')
    if (!t || value.includes(t)) return
    onChange([...value, t])
  }
  return (
    <div className="bg-white rounded-2xl p-4">
      <p className="text-sm font-semibold mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-light/30 text-ink text-sm"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="text-ink-muted"
              aria-label="删除"
            >
              ✕
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-ink-muted">还没有，点下方添加</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl bg-white border border-brand-light px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 rounded-xl bg-brand text-white text-sm"
        >
          添加
        </button>
      </div>
    </div>
  )
}

function HistoryEditor({
  value,
  onChange,
}: {
  value: HistoryEvent[]
  onChange: (v: HistoryEvent[]) => void
}) {
  const [date, setDate] = useState('')
  const [event, setEvent] = useState('')
  const add = () => {
    const ev = event.trim()
    setEvent('')
    setDate('')
    if (!ev) return
    onChange([...value, { date: date.trim(), event: ev }])
  }
  return (
    <div className="bg-white rounded-2xl p-4">
      <p className="text-sm font-semibold mb-2">历史事件</p>
      <div className="space-y-2 mb-2">
        {value.map((h, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-ink">
            {h.date && <span className="text-xs text-ink-muted shrink-0">{h.date}</span>}
            <span className="flex-1">{h.event}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="text-ink-muted"
              aria-label="删除"
            >
              ✕
            </button>
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-xs text-ink-muted">还没有，记下你们的第一次见面、第一次吃饭…</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="日期，如 2026-09-20"
          className="w-36 rounded-xl bg-white border border-brand-light px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
        />
        <input
          type="text"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="发生了什么"
          className="flex-1 rounded-xl bg-white border border-brand-light px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 rounded-xl bg-brand text-white text-sm"
        >
          添加
        </button>
      </div>
    </div>
  )
}
