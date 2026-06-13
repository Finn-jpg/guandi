import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Sign } from '../types'
import { Stage, ActionButton } from './ui'

// 组装分享内容:带上刚求得的签,personalized 文案更利于裂变传播
function buildShare(sign: Sign | null) {
  const url = window.location.origin + window.location.pathname
  const lines = ['关帝灵签 · 求签解签']
  if (sign) {
    const firstVerse = sign.poem.split(/[，,；;。.、\n]/)[0]?.trim()
    lines.push(`我求得第${sign.no}签 · ${sign.fortune}`)
    if (firstVerse) lines.push(firstVerse)
  }
  lines.push('诚则有应,你也来求一签 🙏')
  return { title: '关帝灵签', text: lines.join('\n'), url }
}

export default function Closing({
  sign,
  onAgain,
}: {
  sign: Sign | null
  onAgain: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const data = buildShare(sign)
    // 移动端优先:系统原生分享面板,可一键转发到微信/小红书/微博等
    if (navigator.share) {
      try {
        await navigator.share(data)
      } catch {
        // 用户取消分享,静默
      }
      return
    }
    // 桌面或不支持的浏览器:复制链接兜底
    try {
      await navigator.clipboard.writeText(`${data.text}\n${data.url}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // 静默
    }
  }

  return (
    <Stage className="justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center"
      >
        <div className="text-5xl tracking-[0.3em] text-[var(--color-cinnabar)]">谢</div>
        <p className="mt-8 max-w-[16rem] text-sm leading-7 text-[var(--color-ink-soft)]">
          签已拜读，纸则璧还
          <br />
          心诚则灵，福祸自渡
        </p>
        <div className="mt-10 h-px w-16 bg-[var(--color-ink)]/20" />
      </motion.div>

      <div className="mt-14 flex flex-col items-center gap-5">
        <ActionButton onClick={handleShare}>分 享 灵 签</ActionButton>
        <ActionButton variant="ghost" onClick={onAgain}>
          再 求 一 签
        </ActionButton>
      </div>

      {/* 复制成功提示(仅复制兜底分支出现) */}
      {copied && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-xs tracking-widest text-[var(--color-ink-soft)]/80"
        >
          链接已复制，去分享给好友吧
        </motion.p>
      )}
    </Stage>
  )
}
