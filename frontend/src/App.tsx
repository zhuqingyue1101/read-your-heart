import { useEffect, useState } from 'react'
import UploadPage from './components/UploadPage'
import ResultPage from './components/ResultPage'
import SessionListPage from './components/SessionListPage'
import HistoryPage from './components/HistoryPage'
import SettingsPage from './components/SettingsPage'
import { analyzeChat } from './api'
import {
  loadSessions,
  upsertSession,
  deleteSession,
  deleteRecord,
  clearAllSessions,
  newId,
  nextCrushName,
} from './store'
import type { AnalyzeContext, AnalyzeResponse, AnalysisRecord, Session } from './types'

const LOADING_TEXTS = [
  '正在读你们的小心思…',
  '逐帧分析 TA 的表情包…',
  '军师团开会中…',
  '正在揣摩这句话的潜台词…',
  '鉴定暧昧浓度中…',
]

type Phase = 'list' | 'upload' | 'loading' | 'result' | 'history' | 'settings'

function App() {
  const [phase, setPhase] = useState<Phase>('list')
  const [sessions, setSessions] = useState<Session[]>(loadSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState('')
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0])
  const [lastRequest, setLastRequest] = useState<{
    images: File[]
    context: AnalyzeContext
    name: string
  } | null>(null)
  const [swapped, setSwapped] = useState(false)

  // loading 文案轮播
  useEffect(() => {
    if (phase !== 'loading') return
    let i = 0
    const timer = setInterval(() => {
      i = (i + 1) % LOADING_TEXTS.length
      setLoadingText(LOADING_TEXTS[i])
    }, 1800)
    return () => clearInterval(timer)
  }, [phase])

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null

  const handleNew = () => {
    setActiveSessionId(null)
    setError('')
    setPhase('upload')
  }

  const handleOpen = (session: Session) => {
    setActiveSessionId(session.id)
    setError('')
    setPhase('upload')
  }

  const handleAnalyze = (images: File[], context: AnalyzeContext, name: string) => {
    setSwapped(false)
    setLastRequest({ images, context, name })
    return runAnalysis(images, context, name, false, false)
  }

  const runAnalysis = async (
    images: File[],
    context: AnalyzeContext,
    name: string,
    swapSides: boolean,
    replaceLast: boolean,
  ) => {
    setPhase('loading')
    setError('')
    setLoadingText(LOADING_TEXTS[0])
    try {
      const data = await analyzeChat(images, context, swapSides)

      const id = activeSessionId ?? newId()
      const prev = sessions.find((s) => s.id === id)
      const now = Date.now()
      const record: AnalysisRecord = {
        id: newId(),
        created_at: now,
        relationship_stage: context.relationship_stage,
        goal: context.goal,
        reply_style: context.reply_style,
        conclusion: data.conclusion,
        reasoning_short: data.reasoning_short,
        replies: data.replies,
        dont_send: data.dont_send,
        session_summary: data.session_summary,
      }

      const prevRecords = prev?.records ?? []
      let records: AnalysisRecord[]
      if (replaceLast && prevRecords.length > 0) {
        // 气泡纠错：覆盖上一次分析记录，而不是新增
        const last = prevRecords[prevRecords.length - 1]
        records = [...prevRecords.slice(0, -1), { ...record, created_at: last.created_at }]
      } else {
        records = [...prevRecords, record]
      }

      const session: Session = {
        id,
        name: name || prev?.name || nextCrushName(),
        relationship_stage: context.relationship_stage,
        goal: context.goal,
        reply_style: context.reply_style,
        crush_profile_summary: data.crush_profile_update.summary,
        latest_status: data.crush_profile_update.latest_status,
        crush_traits: data.crush_profile_update.crush_traits,
        user_risk: data.crush_profile_update.user_risk,
        last_conclusion: data.conclusion,
        records,
        created_at: prev?.created_at ?? now,
        updated_at: now,
      }
      setSessions(upsertSession(session))
      setActiveSessionId(id)
      setResult(data)
      setPhase('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : '出了点问题，再试一次')
      setPhase('upload')
    }
  }

  const handleSwapSides = () => {
    if (!lastRequest) return
    const next = !swapped
    setSwapped(next)
    const { images, context, name } = lastRequest
    return runAnalysis(images, context, name, next, true)
  }

  const handleContinue = () => {
    setError('')
    setPhase('upload')
  }

  const handleBackToList = () => {
    setError('')
    setPhase('list')
  }

  const handleDelete = (id: string) => {
    setSessions(deleteSession(id))
    if (activeSessionId === id) setActiveSessionId(null)
  }

  const handleHistory = (session: Session) => {
    setActiveSessionId(session.id)
    setError('')
    setPhase('history')
  }

  const handleSettings = () => {
    setError('')
    setPhase('settings')
  }

  const handleDeleteRecord = (recordId: string) => {
    if (!activeSessionId) return
    setSessions(deleteRecord(activeSessionId, recordId))
  }

  const handleClearAll = () => {
    setSessions(clearAllSessions())
    setActiveSessionId(null)
    setResult(null)
    setLastRequest(null)
    setError('')
    setPhase('list')
  }

  if (phase === 'loading') {
    return (
      <div className="page">
        <p className="text-base font-semibold mb-1 text-center">{loadingText}</p>
        <p className="text-xs text-ink-muted text-center mb-5">OCR 识别 + AI 分析中，稍等几秒</p>

        {/* 结论卡片骨架 */}
        <div className="skeleton rounded-2xl h-28 mb-5" />

        {/* 军师思考骨架 */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <div className="skeleton rounded h-3 w-1/3 mb-3" />
          <div className="skeleton rounded h-2.5 w-full mb-1.5" />
          <div className="skeleton rounded h-2.5 w-5/6 mb-1.5" />
          <div className="skeleton rounded h-2.5 w-2/3" />
        </div>

        {/* 回复建议骨架 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="skeleton rounded h-3 w-1/4 mb-3" />
          <div className="skeleton rounded h-2.5 w-full mb-1.5" />
          <div className="skeleton rounded h-2.5 w-4/5" />
        </div>
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
      <ResultPage
        result={result}
        onContinue={handleContinue}
        onBackToList={handleBackToList}
        onSwapSides={handleSwapSides}
      />
    )
  }

  if (phase === 'history' && activeSession) {
    return (
      <HistoryPage
        session={activeSession}
        onBack={handleBackToList}
        onContinue={handleContinue}
        onDeleteRecord={handleDeleteRecord}
      />
    )
  }

  if (phase === 'settings') {
    return (
      <SettingsPage
        sessions={sessions}
        onBack={handleBackToList}
        onClearAll={handleClearAll}
        onDeleteSession={handleDelete}
      />
    )
  }

  if (phase === 'list') {
    return (
      <SessionListPage
        sessions={sessions}
        onNew={handleNew}
        onOpen={handleOpen}
        onDelete={handleDelete}
        onHistory={handleHistory}
        onSettings={handleSettings}
      />
    )
  }

  const initialContext = activeSession
    ? {
        relationship_stage: activeSession.relationship_stage,
        goal: activeSession.goal,
        reply_style: activeSession.reply_style,
        crush_profile_summary: activeSession.crush_profile_summary,
      }
    : undefined

  return (
    <>
      {error && (
        <div className="bg-warn/15 border border-warn/40 text-ink rounded-xl p-3 mx-auto max-w-[480px] mt-4 text-sm">
          ⚠️ {error}
        </div>
      )}
      <UploadPage
        initialName={activeSession?.name}
        initialContext={initialContext}
        onBack={activeSession ? handleBackToList : undefined}
        onAnalyze={handleAnalyze}
      />
    </>
  )
}

export default App
