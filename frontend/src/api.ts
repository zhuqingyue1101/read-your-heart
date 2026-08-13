import type { AnalyzeContext, AnalyzeResponse } from './types'

export async function analyzeChat(
  images: File[],
  context: AnalyzeContext,
  swapSides = false,
): Promise<AnalyzeResponse> {
  const formData = new FormData()
  images.forEach((img) => formData.append('images', img))
  formData.append('relationship_stage', context.relationship_stage)
  formData.append('goal', context.goal)
  formData.append('reply_style', context.reply_style)
  formData.append('crush_profile_summary', context.crush_profile_summary ?? '')
  formData.append('swap_sides', swapSides ? 'true' : 'false')

  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `请求失败 (${res.status})`)
  }

  return res.json()
}
