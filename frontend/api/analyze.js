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
    {"type": "稳妥版", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "暧昧版", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "松弛版", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "幽默版", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "克制版", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"},
    {"type": "稍微进攻版", "text": "回复正文", "move": "招式名", "usage_note": "原理+时机"}
  ],
  "dont_send": {"text": "不建议发送的话", "reason": "原因"},
  "session_summary": "本次对话摘要，供后续分析使用。不超过100字。",
  "crush_profile_update": {
    "latest_status": "当前关系状态描述",
    "crush_traits": ["对方特征1", "特征2"],
    "user_risk": ["用户风险行为"],
    "summary": "完整关系摘要，供下次分析参考"
  }
}

## 回复生成规则
- 必须返回 6 条回复，类型固定为：稳妥版、暧昧版、松弛版、幽默版、克制版、稍微进攻版
- 每条回复 5-25字为主，最长不超过40字
- 必须口语化、像微信真人会发的话
- 不要书面语、客服腔、翻译腔、情感鸡汤
- 不要出现：如果你愿意的话、我很珍惜、希望我们可以、进一步了解彼此、我认为我们可以、我们之间的关系、认真地说

各类型风格定位：
- 稳妥版：安全不出错，友好但不过界
- 暧昧版：撩一点，暗示好感、制造张力
- 松弛版：轻松随意，像朋友自然聊天
- 幽默版：抖机灵、好玩，能逗笑对方
- 克制版：矜持、留白，不轻易暴露需求感
- 稍微进攻版：主动推进，试探更进一步

## 回复招式标注（重要）
每条回复除了 type（力度标签），还要标注 move（招式名），表示这句话用的是哪个招式。
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

function buildAnalyzeMessages(chatText, ctx) {
  let further = ''
  if (ctx.crush_profile_summary) {
    further = `- ⚠️ 这是基于同一crush的继续分析，以下是之前的档案摘要：\n${ctx.crush_profile_summary}`
  }
  const userContent =
    `## 聊天截图OCR文本\n${chatText}\n\n` +
    `## 用户补充信息\n` +
    `- 双方关系阶段：${ctx.relationship_stage}\n` +
    `- 用户这次想达到的目标：${ctx.goal}\n` +
    `- 用户想要的回复风格：${ctx.reply_style}\n` +
    `${further}\n` +
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
      goal = '试探好感',
      reply_style = '自然一点',
      crush_profile_summary = '',
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
      goal,
      reply_style,
      crush_profile_summary,
    })
    const raw = await chatCompletion(messages)
    const data = parseJsonResponse(raw)
    res.status(200).json(data)
  } catch (e) {
    console.error('分析失败:', e)
    res.status(500).json({ detail: `分析失败，请稍后重试 (${e.message})` })
  }
}
