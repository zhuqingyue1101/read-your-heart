import type { Session } from './types'

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
