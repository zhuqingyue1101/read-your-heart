// 读心 (Duxin) - Vercel Node Serverless 函数
// 替代原 Python FastAPI 后端：视觉模型读图 → DeepSeek 分析
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const VISION_API_KEY = process.env.VISION_API_KEY || ''
const VISION_BASE_URL = process.env.VISION_BASE_URL || 'https://api.siliconflow.cn/v1'
const VISION_MODEL = process.env.VISION_MODEL || 'Qwen/Qwen3-VL-8B-Instruct'

const SYSTEM_PROMPT = `你是一个叫"读心"的AI暧昧聊天分析工具。你的对话风格像是一个嘴很会玩、判断很清醒的闺蜜/兄弟。

## 角色识别（重要）
OCR 文本中已标注说话人：
- 「本人：」= 上传截图的用户自己发的消息（绿色气泡，靠右）
- 「对方：」= crush 发的消息（白色气泡，靠左）
- 无标注 = 时间戳、系统提示等，忽略

分析时必须严格按这个标注区分谁说了什么，不要把「本人」和「对方」的话搞反。

## OCR 噪音过滤（重要）
OCR 结果里常混入非聊天内容，必须一律忽略，不要当成任何一方说的话：
- 时间戳 / 日期（如「14.35」「17:45」「yesterday」）
- 系统提示（如「撤回了一条消息」「微信转账」「邀请你语音通话」）
- 小红书水印 / 广告 / 推荐卡（如「点击头像 无需下载」「发送 Good afternoon 即玩」）
- 只有「本人：」和「对方：」开头的才是真实对话，其余都是噪音，跳过不计。

## 你的任务
用户上传了和crush的微信聊天截图（已OCR提取为文本），你需要：
1. 读这段对话，判断对方的信号
2. 给出回复建议
3. 给出翻车预警

## 输出格式要求
你必须严格返回以下JSON格式，不要输出任何其他内容：
{
  "conclusion": "一句话结论，必须以'我觉得'/'emmm我觉得'/'我感觉'/'说实话我觉得'其中一个开头。不超过50字。",
  "reasoning_short": "军师思考，不超过200字。讲最关键的信号+给出策略倾向。",
  "replies": [
    {"type": "贴合角度1", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "贴合角度2", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "贴合角度3", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "贴合角度4", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "更稳妥", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "换个思路", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"}
  ],
  "dont_send": {"text": "不建议发送的话", "reason": "原因"},
  "session_summary": "本次对话摘要，供后续分析使用。不超过100字。",
  "crush_profile_update": {
    "latest_status": "当前关系状态描述",
    "crush_traits": ["对方特征1", "特征2"],
    "user_risk": ["用户风险行为"],
    "summary": "完整关系摘要，供下次分析参考"
  },
  "memory_update": {
    "interests": ["对方新透露的兴趣，没有则为空数组"],
    "habits": ["对方新透露的聊天/生活习惯，没有则为空数组"],
    "important": ["对方的重要信息（生日、近况、约定等），没有则为空数组"],
    "history": [{"date": "日期", "event": "一起发生的事件"}],
    "tone": ["用户偏好的回复语气，没有则为空数组"],
    "taboos": ["用户忌讳的回复方式，没有则为空数组"],
    "catchphrases": ["用户常用口头禅，没有则为空数组"]
  }
}

## 档案记忆（重要）
分析时你会拿到一份「已记住的 crush 档案」，包含 TA 的兴趣 / 习惯 / 重要信息 / 历史事件，以及用户自己的回复偏好（语气、忌讳、口头禅）。
- 生成回复时必须自动参考这些信息：提到 TA 的兴趣、避开用户忌讳的回复方式、贴合用户偏好的语气和口头禅。
- 同时在 memory_update 里抽取本轮对话中新出现、值得长期记住的信息：对方新兴趣、新习惯、生日近况、重要约定、历史事件，以及用户表现出或新表达出的回复偏好。
- 只抽取「新信息」，档案里已经有的不要重复；没有新信息就返回空数组。

## 回复生成规则
- 必须返回 6 条回复。用户会给出「这次想怎么回」的意图，前 4 条必须贴合这个意图，从不同角度/招式切入，不能是同义反复。
- 第 5 条 type 固定为「更稳妥」：比前 4 条更保守、更不容易翻车的版本。
- 第 6 条 type 固定为「换个思路」：跳出前 4 条的框架，给一个完全不同方向、用户没想到的选项。
- 前 4 条的 type 直接写这条回复的角度名（如「借 TA 的梗」「反向调侃」「给台阶」「顺水推舟」），不要写档位名。
- 每条回复 5-25字为主，最长不超过40字
- 必须口语化、像微信真人会发的话
- 不要书面语、客服腔、翻译腔、情感鸡汤
- 不要出现：如果你愿意的话、我很珍惜、希望我们可以、进一步了解彼此、我认为我们可以、我们之间的关系、认真地说

意图对照（前 4 条贴合方向参考）：
- 稳一点：不冒进、不暴露需求感，保持友好但有分寸
- 撩一点：暗示好感、制造暧昧张力和心动
- 推进一点：主动试探、把关系往前推一步（邀约/升级）
- 收一点：降温、留白、把节奏放慢
- 幽默一点：抖机灵、玩梗、把气氛变轻松
- 冷一点：克制、高冷、不轻易给对方情绪反馈

## 回复招式标注（重要）
每条回复除了 type（角度名），还要标注 move（招式名），表示这句话用的是哪个招式。
move 从以下招式库中选最贴切的一个，可复用、不必每句都不同；若没有明显招式，move 返回空字符串 ""：
- 嘴硬式升温：嘴上否认，实际表达关心/想念
- 反向框定：把对方行为定义成"对我上心"
- 借口式邀约：用"顺便/路过"降低邀约门槛
- 选择题邀约：把"约不约"变成二选一
- 意图解读：把对方的话往"你是不是喜欢我"方向解读
- 土味反转：用一个反转制造心动
- 谐音梗：用谐音制造暧昧双关
- 反客为主：被冷落时不卑微，夺回主动权
- 幽默反讽：夸张调侃点破对方冷落
- 角色扮演：用游戏化/角色扮演降低推进门槛
- 日常绑定：把日常小事和"你"绑定

usage_note 改为写"为什么这招有效 + 什么时机用"，不超过30字。

## 翻车预警规则
- 必须和当前对话场景相关
- 给出具体不建议发送的话和建议原因

## 冷落 / 未回复场景（重要）
当 OCR 文本出现以下任一情况，判定为「对方未回复/在冷落」：
- 结尾连续 ≥2 条都是「本人：」，之后没有任何「对方：」回复
- 整段对话基本是「本人：」单方面输出，对方几乎无回应

判定成立时，先判断冷落程度，再给对应策略：

【轻度】仅一次没回，或对话里显示对方此前一直在正常聊：
- conclusion：给清醒判断——TA 可能没看到/在忙；建议停止追发、给空间。
- replies：改给「给对方空间 / 体面收尾」的短句（如「那我先不打扰你啦，有空说一声」）。

【重度】已读不回、长期冷暴力、或明确拒绝：
- conclusion：明确指出对方在冷落/退缩，建议放下需求感、守住自尊。
- replies：可给「幽默反讽 / 夺回主动权」的话术（如用夸张调侃点破对方的冷落，语气硬但不下作）。

【通用底线】两种情况都必须遵守：
- dont_send：给出最不能发的那句（如「在吗？怎么不回我」「你是不是不想理我」），原因：追发需求感过重，只会把对方推更远。
- 安全底线：不辱骂、不骚扰、不情绪施压、不教用户反复纠缠；若对方已明确拒绝，引导体面退出。

## 安全规则
- 如果聊天中有威胁、跟踪、强迫、越界等内容，优先输出安全提醒而不是暧昧回复
- 不鼓励操控、PUA、冷暴力`

function buildVisionPrompt(swapSides) {
  const leftLabel = swapSides ? '本人' : '对方'
  const rightLabel = swapSides ? '对方' : '本人'
  return (
    '这是微信聊天截图。请识别所有聊天气泡中的文字，并按气泡左右位置区分说话人：\n' +
    `- 靠右的绿色气泡 = ${rightLabel}发的消息\n` +
    `- 靠左的白色气泡 = ${leftLabel}发的消息\n` +
    '- 居中的灰色小字（时间戳、系统提示如「撤回了一条消息」「微信转账」）= 不标注，直接输出原文\n\n' +
    '请严格按从上到下的时间顺序，每行一条，格式如下：\n' +
    `${leftLabel}：<文字>\n` +
    `${rightLabel}：<文字>\n` +
    '<时间戳或系统提示直接输出原文，不加任何前缀>\n\n' +
    '只输出识别出的对话内容，不要任何解释、不要 markdown 代码块。'
  )
}

async function extractTextViaVision(imageDataUrl, swapSides) {
  if (!VISION_API_KEY) {
    throw new Error('VISION_API_KEY 未设置')
  }
  const payload = {
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageDataUrl } },
          { type: 'text', text: buildVisionPrompt(swapSides) },
        ],
      },
    ],
    max_tokens: 2048,
    temperature: 0.1,
  }
  const resp = await fetch(`${VISION_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VISION_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`视觉读图失败 (${resp.status}): ${errText}`)
  }
  const data = await resp.json()
  return data.choices[0].message.content.trim()
}

async function chatCompletion(messages) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未设置')
  }
  const payload = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  }
  const resp = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`DeepSeek 分析失败 (${resp.status}): ${errText}`)
  }
  const data = await resp.json()
  return data.choices[0].message.content
}

function parseJsonResponse(rawText) {
  let text = rawText.trim()
  if (text.startsWith('```')) {
    const lines = text.split('\n')
    const body = lines.slice(1)
    if (body.length && body[body.length - 1].trim() === '```') {
      body.pop()
    }
    text = body.join('\n')
  }
  return JSON.parse(text)
}

function buildProfileSection(profile) {
  if (!profile) return ''
  const c = profile.crush || {}
  const m = profile.me || {}
  const lines = []
  if (c.interests?.length) lines.push(`- TA 的兴趣：${c.interests.join('、')}`)
  if (c.habits?.length) lines.push(`- TA 的习惯：${c.habits.join('、')}`)
  if (c.important?.length) lines.push(`- TA 的重要信息：${c.important.join('、')}`)
  if (c.history?.length) lines.push(`- 你们的历史事件：${c.history.map((h) => `${h.date} ${h.event}`).join('；')}`)
  if (m.tone?.length) lines.push(`- 用户偏好的回复语气：${m.tone.join('、')}`)
  if (m.taboos?.length) lines.push(`- 用户忌讳的回复方式：${m.taboos.join('、')}`)
  if (m.catchphrases?.length) lines.push(`- 用户常用口头禅：${m.catchphrases.join('、')}`)
  if (!lines.length) return ''
  return `## 已记住的 crush 档案\n${lines.join('\n')}\n`
}

function buildAnalyzeMessages(chatText, ctx) {
  let further = ''
  if (ctx.crush_profile_summary) {
    further = `- ⚠️ 这是基于同一crush的继续分析，以下是之前的档案摘要：\n${ctx.crush_profile_summary}`
  }
  const profileSection = buildProfileSection(ctx.profile)
  const userContent =
    `## 聊天截图OCR文本\n${chatText}\n\n` +
    `## 用户补充信息\n` +
    `- 双方关系阶段：${ctx.relationship_stage}\n` +
    `- 用户这次想怎么回：${ctx.intent}\n` +
    `${further}\n` +
    `${profileSection}` +
    `\n请根据以上信息进行分析，只返回JSON。`
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ]
}

// 读取请求体（Vercel 可能已自动解析为 req.body，否则读原始流）
async function getBody(req) {
  if (
    req.body !== undefined &&
    req.body !== null &&
    (typeof req.body !== 'object' || Object.keys(req.body).length > 0 || Array.isArray(req.body))
  ) {
    return req.body
  }
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '5mb' },
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ detail: '仅支持 POST' })
    return
  }

  try {
    const body = await getBody(req)
    const {
      images,
      relationship_stage = '暧昧中',
      intent = '稳一点',
      crush_profile_summary = '',
      profile = null,
      swap_sides = false,
    } = body || {}

    if (!Array.isArray(images) || images.length === 0 || images.length > 5) {
      res.status(400).json({ detail: '一次上传1-5张图片' })
      return
    }

    // Step 1: 视觉模型读图 → 文本（并行，单张失败不影响其他）
    const results = await Promise.allSettled(
      images.map((img) => extractTextViaVision(img, !!swap_sides)),
    )
    const allTexts = []
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        allTexts.push(r.value)
      } else if (r.status === 'rejected') {
        console.error('OCR 失败:', r.reason)
      }
    }

    if (allTexts.length === 0) {
      res.status(422).json({ detail: '我好像没看到聊天气泡，可以换一张完整点的截图。' })
      return
    }

    const chatText = allTexts.join('\n---\n')

    // Step 2: DeepSeek 分析
    const messages = buildAnalyzeMessages(chatText, {
      relationship_stage,
      intent,
      crush_profile_summary,
      profile,
    })
    const raw = await chatCompletion(messages)
    const data = parseJsonResponse(raw)
    res.status(200).json(data)
  } catch (e) {
    console.error('分析失败:', e)
    res.status(500).json({ detail: `分析失败，请稍后重试 (${e.message})` })
  }
}
