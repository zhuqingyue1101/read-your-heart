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

export interface AnalyzeResponse {
  conclusion: string
  reasoning_short: string
  replies: Reply[]
  dont_send: DontSend
  session_summary: string
  crush_profile_update: CrushProfileUpdate
}

// 上下文选择
export interface AnalyzeContext {
  relationship_stage: string
  goal: string
  reply_style: string
  crush_profile_summary?: string // 续读时带入的上次档案摘要
}

// 会话（一条 crush 关系线）
export interface Session {
  id: string
  name: string // 备注名；为空则自动 "Crush N"
  relationship_stage: string
  goal: string
  reply_style: string
  crush_profile_summary: string // 上次 crush_profile_update.summary
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
