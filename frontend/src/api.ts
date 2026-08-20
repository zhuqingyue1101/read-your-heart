import type { AnalyzeContext, AnalyzeResponse } from './types'

// 压缩图片：长边缩到 maxEdge 内，转 JPEG data URL。
// 前端压缩是为了控制请求体积（Vercel 免费函数有 ~4.5MB body 限制），
// 同时视觉模型也用不上超过 2048px 的原图。
function compressImage(file: File, maxEdge = 2048, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (Math.max(width, height) > maxEdge) {
        const scale = maxEdge / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建画布'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })
}

export async function analyzeChat(
  images: File[],
  context: AnalyzeContext,
  swapSides = false,
): Promise<AnalyzeResponse> {
  const compressed = await Promise.all(images.map((img) => compressImage(img)))

  const payload = {
    images: compressed,
    relationship_stage: context.relationship_stage,
    goal: context.goal,
    reply_style: context.reply_style,
    crush_profile_summary: context.crush_profile_summary ?? '',
    swap_sides: swapSides,
  }

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `请求失败 (${res.status})`)
  }

  return res.json()
}
