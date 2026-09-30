// 与后端 models.py 对应的类型定义

export interface Reply {
  type: string // "稳妥版" | "暧昧版" | "松弛版" 等
  text: string
  move?: string // 招式名（如"嘴硬式升温"），旧数据可能没有
  usage_note: string
}

export interface DontSend {
  text: string
  reason: string
}

export interface CrushProfileUpdate {
  latest_status: string
  crush_traits: string[]
  user_risk: string[]
  summary: string
}

// 一条历史事件（带日期）
export interface HistoryEvent {
  date: string
  event: string
}

// 结构化 crush 档案：对方信息 + 用户自己的回复偏好
export interface CrushProfile {
  crush: {
    interests: string[] // 对方兴趣
    habits: string[] // 聊天/生活习惯
    important: string[] // 重要信息（生日、近况等）
    history: HistoryEvent[] // 历史事件
  }
  me: {
    tone: string[] // 用户想要的回复语气
    taboos: string[] // 用户忌讳的回复方式
    catchphrases: string[] // 用户常用口头禅
  }
}

// 每轮分析后由 LLM 抽取、需要合并进档案的新信息
export interface MemoryUpdate {
  interests: string[]
  habits: string[]
  important: string[]
  history: HistoryEvent[]
  tone: string[]
  taboos: string[]
  catchphrases: string[]
}

export interface AnalyzeResponse {
  conclusion: string
  reasoning_short: string
  replies: Reply[]
  dont_send: DontSend
  session_summary: string
  crush_profile_update: CrushProfileUpdate
  memory_update?: MemoryUpdate // 本轮抽取的记忆增量（合并进档案）
}

// 上下文选择
export interface AnalyzeContext {
  relationship_stage: string
  goal: string
  reply_style: string
  crush_profile_summary?: string // 续读时带入的上次档案摘要
  profile?: CrushProfile // 结构化档案，分析时全量带入
}

// 会话（一条 crush 关系线）
export interface Session {
  id: string
  name: string // 备注名；为空则自动 "Crush N"
  relationship_stage: string
  goal: string
  reply_style: string
  crush_profile_summary: string // 上次 crush_profile_update.summary
  profile?: CrushProfile // 结构化 crush 档案（记忆）
  latest_status?: string // 当前关系状态
  crush_traits?: string[] // 对方特征
  user_risk?: string[] // 用户风险行为
  last_conclusion: string // 上次结论，列表卡片展示
  records?: AnalysisRecord[] // 历次分析记录（多轮历史）
  created_at: number
  updated_at: number
}

// 单次分析记录（历史详情用，不存原始截图）
export interface AnalysisRecord {
  id: string
  created_at: number
  relationship_stage: string
  goal: string
  reply_style: string
  conclusion: string
  reasoning_short: string
  replies: Reply[]
  dont_send: DontSend
  session_summary: string
}
