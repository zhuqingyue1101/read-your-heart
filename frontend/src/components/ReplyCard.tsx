import { useState } from 'react'
import type { Reply } from '../types'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 剪贴板不可用时静默失败
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`text-xs px-3 py-1 rounded-full transition-colors ${
        copied ? 'bg-brand text-white' : 'bg-brand-light/40 text-ink-muted'
      }`}
    >
      {copied ? '已复制 ✓' : '复制'}
    </button>
  )
}

interface Props {
  reply: Reply
}

export default function ReplyCard({ reply }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-brand bg-brand-light/30 px-2.5 py-1 rounded-full">
          {reply.type}
        </span>
        {reply.move && (
          <span className="text-xs text-ink-muted bg-ink/5 px-2.5 py-1 rounded-full">
            {reply.move}
          </span>
        )}
        <div className="ml-auto">
          <CopyButton text={reply.text} />
        </div>
      </div>
      <p className="text-base leading-relaxed text-ink">{reply.text}</p>
      {reply.usage_note && (
        <p className="text-xs text-ink-muted mt-2">💡 {reply.usage_note}</p>
      )}
    </div>
  )
}
