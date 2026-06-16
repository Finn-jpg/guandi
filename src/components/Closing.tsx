import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Sign } from '../types'
import { Stage, ActionButton } from './ui'
import { track, useShow } from '../lib/track'

// 组装分享文案:带上刚求得的签 + 应用链接,personalized 更利于裂变传播
function buildShareText(sign: Sign | null) {
  const url = window.location.origin + window.location.pathname
  const lines = ['关帝灵签 · 求签解签']
  if (sign) {
    const firstVerse = sign.poem.split(/[，,；;。.、\n]/)[0]?.trim()
    lines.push(`我求得第${sign.no}签 · ${sign.fortune}`)
    if (firstVerse) lines.push(firstVerse)
  }
  lines.push('诚则有应,你也来求一签 🙏')
  lines.push(url)
  return lines.join('\n')
}

// 健壮复制:优先剪贴板 API,降级到老式 execCommand(兼容部分微信/小红书 webview)
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 落到兜底方案
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export default function Closing({ sign, onAgain }: { sign: Sign | null; onAgain: () => void }) {
  const [copied, setCopied] = useState(false)
  const signNo = sign?.no

  // 结束页两个按钮曝光
  useShow('share', { stage: 'closing', signNo })
  useShow('again', { stage: 'closing', signNo })

  // 复制个性化文案+链接,提示用户粘贴给好友(微信/小红书等裂变主流方式)
  async function handleShare() {
    track('share', 'click', { stage: 'closing', trigger: 'click', signNo })
    await copyText(buildShareText(sign))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2600)
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
        <ActionButton
          variant="ghost"
          onClick={() => {
            track('again', 'click', { stage: 'closing', trigger: 'click', signNo })
            onAgain()
          }}
        >
          再 求 一 签
        </ActionButton>
      </div>

      {/* 复制成功提示 */}
      {copied && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-xs tracking-widest text-[var(--color-cinnabar)]"
        >
          链接已复制，粘贴分享给好友
        </motion.p>
      )}
    </Stage>
  )
}
