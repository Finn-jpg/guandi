import { useState } from 'react'
import { motion } from 'framer-motion'
import { useShake } from '../hooks/useShake'
import { Stage, ActionButton } from './ui'
import { track, useShow, type Trigger } from '../lib/track'

interface Props {
  motionOk: boolean
  onDrawn: () => void
}

export default function DrawSign({ motionOk, onDrawn }: Props) {
  const [drawing, setDrawing] = useState(false)

  // 抽签按钮曝光
  useShow('draw', { stage: 'draw' })

  function draw(trigger: Trigger) {
    if (drawing) return
    track('draw', 'click', { stage: 'draw', trigger })
    setDrawing(true)
    // 签条弹出动画后进入掷筊确认
    window.setTimeout(onDrawn, 1100)
  }

  useShake({ enabled: motionOk && !drawing, onShake: () => draw('shake') })

  return (
    <Stage className="justify-center text-center">
      <div className="mb-1 text-2xl tracking-[0.2em]">抽 取 灵 签</div>
      <p className="mb-12 text-sm text-[var(--color-ink-soft)]">心念所求，请取一签</p>

      {/* 签筒 + 弹出的签条 */}
      <div className="relative flex h-64 w-40 items-end justify-center">
        {/* 抽出的竹签:扁平竹片,朱砂签头 + 签号,升起时微微倾斜 */}
        <motion.div
          className="absolute bottom-28 z-10"
          initial={{ y: 70, opacity: 0, rotate: 0 }}
          animate={drawing ? { y: -84, opacity: 1, rotate: -6 } : { y: 70, opacity: 0, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex h-[150px] w-[18px] flex-col items-center rounded-t-[3px] bg-[var(--color-gold)]">
            {/* 朱砂签头 */}
            <div className="mt-[7px] flex h-[22px] w-[13px] items-center justify-center rounded-[2px] bg-[var(--color-cinnabar)]">
              <span className="text-[9px] leading-none text-[var(--color-paper)]">签</span>
            </div>
            {/* 竹节纹 */}
            <div className="mt-4 h-px w-3 bg-[var(--color-ink)]/15" />
            <div className="mt-7 h-px w-3 bg-[var(--color-ink)]/15" />
          </div>
        </motion.div>

        {/* 筒内竹签:扁平竹片,高低错落 */}
        <div className="absolute bottom-24 z-0 flex items-end gap-[3px]">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="w-3 rounded-t-[2px] bg-[var(--color-gold)]/80"
              style={{ height: `${50 + (i % 3) * 11}px` }}
            >
              {/* 竹节纹 */}
              <div className="mx-auto mt-1 h-px w-2 bg-[var(--color-ink)]/10" />
            </div>
          ))}
        </div>

        {/* 签筒 */}
        <motion.div
          className="relative z-20 flex h-28 w-28 items-center justify-center rounded-b-md border-2 border-[var(--color-ink)]/30 bg-[var(--color-paper-deep)]"
          animate={drawing ? { rotate: [0, -3, 3, -2, 0] } : { rotate: 0 }}
          transition={{ duration: 0.6 }}
          style={{ borderRadius: '6px 6px 10px 10px' }}
        >
          <span className="text-4xl tracking-tight text-[var(--color-ink)]">签</span>
          <span className="absolute -top-2 left-0 right-0 mx-2 h-1 rounded-full bg-[var(--color-ink)]/20" />
        </motion.div>
      </div>

      <div className="mt-12">
        <ActionButton onClick={() => draw('click')} disabled={drawing}>
          {drawing ? '抽 签 中…' : '抽 签'}
        </ActionButton>
        {motionOk && !drawing && (
          <p className="mt-6 text-xs tracking-widest text-[var(--color-ink-soft)]/70">
            或 摇 一 摇 手 机
          </p>
        )}
      </div>
    </Stage>
  )
}
