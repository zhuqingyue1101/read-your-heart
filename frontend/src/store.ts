import type { Session, CrushProfile, MemoryUpdate, HistoryEvent } from './types'

const SESSIONS_KEY = 'duxin_sessions'
const COUNTER_KEY = 'duxin_session_counter'

function readSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? (JSON.parse(raw) as Session[]) : []
  } catch {
    return []
  }
}

function writeSessions(sessions: Session[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function loadSessions(): Session[] {
  return readSessions().sort((a, b) => b.updated_at - a.updated_at)
}

export function upsertSession(session: Session): Session[] {
  const sessions = readSessions()
  const idx = sessions.findIndex((s) => s.id === session.id)
  if (idx >= 0) sessions[idx] = session
  else sessions.push(session)
  writeSessions(sessions)
  return loadSessions()
}

export function deleteSession(id: string): Session[] {
  writeSessions(readSessions().filter((s) => s.id !== id))
  return loadSessions()
}

export function clearAllSessions(): Session[] {
  localStorage.removeItem(SESSIONS_KEY)
  localStorage.removeItem(COUNTER_KEY)
  return []
}

export function deleteRecord(sessionId: string, recordId: string): Session[] {
  const sessions = readSessions()
  const idx = sessions.findIndex((s) => s.id === sessionId)
  if (idx >= 0) {
    sessions[idx] = {
      ...sessions[idx],
      records: (sessions[idx].records ?? []).filter((r) => r.id !== recordId),
    }
  }
  writeSessions(sessions)
  return loadSessions()
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function nextCrushName(): string {
  const n = Number(localStorage.getItem(COUNTER_KEY) || 0) + 1
  localStorage.setItem(COUNTER_KEY, String(n))
  return `Crush ${n}`
}

// ---------- crush 档案（记忆） ----------

export function emptyProfile(): CrushProfile {
  return {
    crush: { interests: [], habits: [], important: [], history: [] },
    me: { tone: [], taboos: [], catchphrases: [] },
  }
}

function dedupe(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])]
}

function mergeHistory(old: HistoryEvent[], add: HistoryEvent[]): HistoryEvent[] {
  const seen = new Set(old.map((h) => `${h.date}|${h.event}`))
  const merged = [...old]
  for (const h of add) {
    const key = `${h.date}|${h.event}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(h)
  }
  return merged
}

// 把本轮 LLM 抽取的 memory_update 合并进旧档案（只追加、去重，不覆盖已有条目）
export function mergeProfile(
  old: CrushProfile | undefined,
  update: MemoryUpdate | undefined,
): CrushProfile {
  const base = old ?? emptyProfile()
  if (!update) return base
  return {
    crush: {
      interests: dedupe(base.crush.interests, update.interests ?? []),
      habits: dedupe(base.crush.habits, update.habits ?? []),
      important: dedupe(base.crush.important, update.important ?? []),
      history: mergeHistory(base.crush.history ?? [], update.history ?? []),
    },
    me: {
      tone: dedupe(base.me.tone, update.tone ?? []),
      taboos: dedupe(base.me.taboos, update.taboos ?? []),
      catchphrases: dedupe(base.me.catchphrases, update.catchphrases ?? []),
    },
  }
}
