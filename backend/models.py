from pydantic import BaseModel


# --- 请求模型 ---

class AnalyzeRequest(BaseModel):
    relationship_stage: str = "暧昧中"
    goal: str = "试探好感"
    reply_style: str = "自然一点"
    crush_profile_summary: str = ""
    default_user_side: str = "right_green"


# --- 响应模型 ---

class Reply(BaseModel):
    type: str          # "稳妥版" | "暧昧版" | "松弛版" 等
    text: str          # 回复正文
    move: str = ""     # 招式名（如"嘴硬式升温"），无则空字符串
    usage_note: str    # 原理+适用时机，≤30字


class DontSend(BaseModel):
    text: str
    reason: str


class CrushProfileUpdate(BaseModel):
    latest_status: str
    crush_traits: list[str]
    user_risk: list[str]
    summary: str


class AnalyzeResponse(BaseModel):
    conclusion: str                                # 一句话结论
    reasoning_short: str                           # 军师思考，≤200字
    replies: list[Reply]                           # 6条回复
    dont_send: DontSend                            # 翻车预警
    session_summary: str                           # 本次会话摘要
    crush_profile_update: CrushProfileUpdate       # 档案更新
