import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Sign } from '../types'
import { ActionButton, Seal } from './ui'

function Section({
  label,
  text,
  defaultOpen = false,
}: {
  label: string
  text?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (!text) return null
  return (
    <div className="border-b border-[var(--color-ink)]/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-base tracking-[0.25em] text-[var(--color-ink)]">{label}</span>
        <span className="text-[var(--color-ink-soft)]">{open ? '—' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="whitespace-pre-line pb-5 text-[15px] leading-8 text-[var(--color-ink-soft)]">
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SignResult({ sign, onClose }: { sign: Sign; onClose: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col overflow-y-auto px-7 pb-10"
    >
      {/* 签头 */}
      <div className="flex flex-col items-center pt-12 text-center">
        <div className="flex items-center gap-3 text-sm text-[var(--color-ink-soft)]">
          <Seal text={sign.fortune} />
          <span className="tracking-[0.2em]">{sign.ganzhi}</span>
        </div>
        <h2 className="mt-3 text-3xl tracking-[0.2em] text-[var(--color-ink)]">
          第{sign.no}签
        </h2>
      </div>

      {/* 签诗 · 竖排 */}
      <div className="my-10 flex justify-center">
        <div className="vertical-rl max-h-72 text-2xl leading-[2.2] tracking-[0.3em] text-[var(--color-ink)]">
          {sign.poem}
        </div>
      </div>

      {/* 解签分区 */}
      <div className="mt-2">
        <Section label="解 曰" text={sign.jieyue} defaultOpen />
        <Section label="断 曰" text={sign.duanyue} />
        <Section label="圣 意" text={sign.shengyi} />
        <Section label="释 义" text={sign.shiyi} />
        <Section label="解 签" text={sign.jieqian} />
        <Section label="东 坡 解" text={sign.dongpo} />
        <Section label="碧 仙 注" text={sign.bixian} />
        <Section label="相 关 故 事" text={sign.story} />
      </div>

      <div className="mt-12 flex justify-center">
        <ActionButton onClick={onClose}>叩 谢 帝 爷 公</ActionButton>
      </div>
    </motion.section>
  )
}
