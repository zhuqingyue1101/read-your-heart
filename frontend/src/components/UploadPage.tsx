import { useRef, useState } from 'react'
import type { AnalyzeContext } from '../types'

const RELATIONSHIP_STAGES = [
  '刚认识',
  '见过面',
  '聊了一阵',
  '暧昧中',
  '约会过',
  '冷淡期',
  '复联中',
]
const GOALS = [
  '试探好感',
  '撩对方',
  '暧昧一点',
  '矜持一点',
  '想打直球',
  '冷漠一些',
]
const REPLY_STYLES = [
  '自然一点',
  '可爱一点',
  '高冷一点',
  '拽一点',
  '搞笑一点',
  '直球一点',
]

const MAX_TAGS = 3

function splitValue(value: string): string[] {
  return value
    .split(/[、,，/;；\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseSelection(
  value: string | undefined,
  options: string[],
  fallbackTags: string[],
): { tags: string[]; custom: string } {
  if (!value) return { tags: fallbackTags, custom: '' }
  const parts = splitValue(value)
  const tags = parts.filter((p) => options.includes(p))
  const custom = parts.filter((p) => !options.includes(p)).join('、')
  return { tags: tags.length ? tags : fallbackTags, custom }
}

function combine(tags: string[], custom: string): string {
  return [...tags, custom.trim()].filter(Boolean).join('、')
}

function toggleTag(current: string[], tag: string, max = MAX_TAGS): string[] {
  if (current.includes(tag)) return current.filter((t) => t !== tag)
  if (current.length >= max) return current
  return [...current, tag]
}

function joinTags(tags: string[]): string {
  return tags.join('、') || '未选'
}

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

  const stageInit = parseSelection(initialContext?.relationship_stage, RELATIONSHIP_STAGES, ['暧昧中'])
  const goalInit = parseSelection(initialContext?.goal, GOALS, ['试探好感'])
  const styleInit = parseSelection(initialContext?.reply_style, REPLY_STYLES, ['自然一点'])

  const [stage, setStage] = useState<string[]>(stageInit.tags)
  const [stageCustom, setStageCustom] = useState(stageInit.custom)
  const [goal, setGoal] = useState<string[]>(goalInit.tags)
  const [goalCustom, setGoalCustom] = useState(goalInit.custom)
  const [style, setStyle] = useState<string[]>(styleInit.tags)
  const [styleCustom, setStyleCustom] = useState(styleInit.custom)

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
        relationship_stage: combine(stage, stageCustom),
        goal: combine(goal, goalCustom),
        reply_style: combine(style, styleCustom),
        crush_profile_summary: initialContext?.crush_profile_summary ?? '',
        profile: initialContext?.profile,
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
          📌 正在续读：{name || '这条线'}（{joinTags(stage)} · {joinTags(goal)}），上次档案已带入
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
        <TagField
          label="你们现在什么关系？"
          options={RELATIONSHIP_STAGES}
          selected={stage}
          onToggle={(tag) => setStage((prev) => toggleTag(prev, tag))}
          custom={stageCustom}
          onCustomChange={setStageCustom}
        />

        <TagField
          label="这次想达到什么目标？"
          options={GOALS}
          selected={goal}
          onToggle={(tag) => setGoal((prev) => toggleTag(prev, tag))}
          custom={goalCustom}
          onCustomChange={setGoalCustom}
        />

        <TagField
          label="回复想要什么风格？"
          options={REPLY_STYLES}
          selected={style}
          onToggle={(tag) => setStyle((prev) => toggleTag(prev, tag))}
          custom={styleCustom}
          onCustomChange={setStyleCustom}
        />
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

function TagField({
  label,
  options,
  selected,
  onToggle,
  custom,
  onCustomChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (tag: string) => void
  custom: string
  onCustomChange: (value: string) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-semibold">{label}</p>
        <span className="text-xs text-ink-muted">最多选 3 个</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>
            {o}
          </Chip>
        ))}
      </div>
      <input
        type="text"
        value={custom}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="自定义输入（可选）"
        className="mt-2 w-full rounded-xl bg-white border border-brand-light px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
      />
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
