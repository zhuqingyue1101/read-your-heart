import { useRef, useState } from 'react'
import type { AnalyzeContext } from '../types'

const RELATIONSHIP_STAGES = [
  '刚认识',
  '聊了一阵',
  '暧昧中',
  '见过面',
  '约会后',
  '冷淡期',
  '复联中',
  '我也说不清',
]
const GOALS = [
  '继续聊',
  '试探好感',
  '暧昧一点',
  '约出来',
  '不想显得太主动',
  '想打直球',
  '体面撤退',
  '看看我有没有戏',
]
const REPLY_STYLES = [
  '自然一点',
  '甜一点',
  '拽一点',
  '搞笑一点',
  '清冷一点',
  '直球一点',
  '像我本人',
  '别太AI',
]

interface Props {
  initialName?: string
  initialContext?: AnalyzeContext
  onBack?: () => void
  onAnalyze: (images: File[], context: AnalyzeContext, name: string) => void
}

export default function UploadPage({ initialName, initialContext, onBack, onAnalyze }: Props) {
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [tooMany, setTooMany] = useState(false)
  const [name, setName] = useState(initialName ?? '')
  const [stage, setStage] = useState(initialContext?.relationship_stage ?? '暧昧中')
  const [goal, setGoal] = useState(initialContext?.goal ?? '试探好感')
  const [style, setStyle] = useState(initialContext?.reply_style ?? '自然一点')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (files: FileList | null) => {
    if (!files) return
    const combined = [...images, ...Array.from(files)]
    setTooMany(combined.length > 5)
    const next = combined.slice(0, 5)
    setImages(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index)
    setImages(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
    if (next.length <= 5) setTooMany(false)
  }

  const moveImage = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    const nextPreviews = [...previews]
    ;[nextPreviews[index], nextPreviews[target]] = [nextPreviews[target], nextPreviews[index]]
    setImages(next)
    setPreviews(nextPreviews)
  }

  const submit = () => {
    if (images.length === 0) return
    onAnalyze(
      images,
      {
        relationship_stage: stage,
        goal,
        reply_style: style,
        crush_profile_summary: initialContext?.crush_profile_summary ?? '',
      },
      name.trim(),
    )
  }

  return (
    <div className="page">
      {/* 标题 */}
      <header className="mb-5">
        {onBack && (
          <button type="button" onClick={onBack} className="text-sm text-ink-muted mb-3">
            ← 返回列表
          </button>
        )}
        <h1 className="text-2xl font-bold">读心 💘</h1>
        <p className="text-sm text-ink-muted mt-1">
          上传和 crush 的聊天截图，看看 TA 到底什么意思
        </p>
      </header>

      {/* 续读提示 */}
      {initialContext && (
        <div className="bg-brand-light/20 border border-brand-light/50 rounded-xl px-3 py-2 text-xs text-ink mb-4">
          📌 正在续读：{name || '这条线'}（{stage} · {goal}），上次档案已带入
        </div>
      )}

      {/* 备注名 */}
      <div className="mb-4">
        <p className="text-sm font-semibold mb-2">备注名（可选）</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="给这段关系起个名字，比如 TA / 学长 / 健身房小哥"
          className="w-full rounded-xl bg-white border border-brand-light px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
        />
      </div>

      {tooMany && (
        <div className="bg-warn/15 border border-warn/40 text-ink rounded-xl px-3 py-2 text-xs mb-3">
          ⚠️ 一次最多看 5 张，先挑最关键的几张发我
        </div>
      )}

      {/* 图片上传区 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleSelect(e.target.files)}
      />

      {previews.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-touch w-full rounded-2xl border-2 border-dashed border-brand-light bg-white flex flex-col items-center justify-center gap-2 py-10 text-ink-muted"
        >
          <span className="text-4xl">📷</span>
          <span className="text-sm">点这里上传截图（1-5张）</span>
          <span className="text-xs">支持 jpg / png / webp，单张 ≤10MB</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square">
              <img
                src={src}
                alt={`截图${i + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-ink text-white text-xs flex items-center justify-center"
              >
                ✕
              </button>
              {images.length > 1 && (
                <>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-ink/60 text-white text-xs flex items-center justify-center"
                      aria-label="左移"
                    >
                      ◀
                    </button>
                  )}
                  {i < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-ink/60 text-white text-xs flex items-center justify-center"
                      aria-label="右移"
                    >
                      ▶
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-brand-light bg-white text-ink-muted text-2xl"
            >
              +
            </button>
          )}
        </div>
      )}

      {/* 上下文选择 */}
      <div className="space-y-5 mt-6">
        <Field label="你们现在什么关系？">
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_STAGES.map((s) => (
              <Chip key={s} active={stage === s} onClick={() => setStage(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="这次想达到什么目标？">
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip key={g} active={goal === g} onClick={() => setGoal(g)}>
                {g}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="回复想要什么风格？">
          <div className="flex flex-wrap gap-2">
            {REPLY_STYLES.map((s) => (
              <Chip key={s} active={style === s} onClick={() => setStyle(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      {/* 提交 */}
      <button
        type="button"
        onClick={submit}
        disabled={images.length === 0}
        className="btn-touch mt-8 w-full rounded-2xl bg-brand text-white text-base font-semibold disabled:opacity-40"
      >
        开始读心 ✨
      </button>

      <p className="text-xs text-ink-muted text-center mt-4">
        🔒 截图只在本地识别，不会保存到服务器
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold mb-2">{label}</p>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm transition-colors ${
        active
          ? 'bg-brand text-white'
          : 'bg-white text-ink border border-brand-light'
      }`}
    >
      {children}
    </button>
  )
}
