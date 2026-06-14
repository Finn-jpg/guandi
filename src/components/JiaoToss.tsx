import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { CupFace, JiaoResult } from '../types'
import { tossJiao, JIAO_LABEL, JIAO_HINT } from '../hooks/useDivination'
import { useShake } from '../hooks/useShake'
import { Stage, ActionButton } from './ui'
import { track, useShow, type EventName, type Trigger } from '../lib/track'

interface Props {
  motionOk: boolean
  title: string
  subtitle: string
  eventKey: 'ask' | 'confirm' // 埋点前缀:区分请示/确认两处掷茭
  signNo?: number             // 确认阶段带上当前签号
  onApproved: () => void
  onRejected?: () => void // 提供则 笑/阴筊 时回到抽签;否则原地再掷
}

// 单只筊杯:月牙造型,阳=平面朝上(浅) 阴=隆起朝上(深)
function Cup({ face, spinning }: { face: CupFace; spinning: boolean }) {
  return (
    <motion.div
      className="relative h-24 w-16"
      animate={
        spinning
          ? { rotateX: [0, 360, 720, 1080], y: [0, -40, 0, -20, 0] }
          : { rotateY: face === 'yin' ? 180 : 0, y: 0 }
      }
      transition={spinning ? { duration: 1, ease: 'easeOut' } : { duration: 0.4 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <svg viewBox="0 0 64 96" className="h-full w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]">
        <path
          d="M12 6 C 40 18, 56 50, 50 90 C 30 78, 14 50, 12 6 Z"
          fill={face === 'yin' ? '#7e2a20' : '#b9614f'}
          stroke="#7e2a20"
          strokeWidth="2"
        />
      </svg>
    </motion.div>
  )
}

export default function JiaoToss({
  motionOk,
  title,
  subtitle,
  eventKey,
  signNo,
  onApproved,
  onRejected,
}: Props) {
  const [cups, setCups] = useState<[CupFace, CupFace]>(['yang', 'yin'])
  const [result, setResult] = useState<JiaoResult | null>(null)
  const [phase, setPhase] = useState<'idle' | 'tossing' | 'done'>('idle')

  const tossEvent = `${eventKey}_toss` as EventName
  const continueEvent = `${eventKey}_continue` as EventName

  // 掷茭按钮曝光(本界面 mount 即可见)
  useShow(tossEvent, { stage: eventKey, signNo })

  // 圣筊后"继续"按钮出现 → 曝光一次
  const continueShown = useRef(false)
  useEffect(() => {
    if (result === 'sheng' && !continueShown.current) {
      continueShown.current = true
      track(continueEvent, 'show', { stage: eventKey, signNo })
    }
  }, [result, continueEvent, eventKey, signNo])

  // trigger 有值才记点击:掷筊按钮='click'、摇一摇='shake';"再掷一次"不传→不记
  function toss(trigger?: Trigger) {
    if (phase === 'tossing') return
    if (trigger) track(tossEvent, 'click', { stage: eventKey, trigger, signNo })
    setPhase('tossing')
    setResult(null)
    const { cups: c, result: r } = tossJiao()
    window.setTimeout(() => {
      setCups(c)
      setResult(r)
      setPhase('done')
    }, 1050)
  }

  useShake({ enabled: motionOk && phase !== 'tossing', onShake: () => toss('shake') })

  const spinning = phase === 'tossing'

  return (
    <Stage className="justify-center text-center">
      <div className="mb-1 text-2xl tracking-[0.2em] text-[var(--color-ink)]">{title}</div>
      <p className="mb-12 text-sm text-[var(--color-ink-soft)]">{subtitle}</p>

      <div className="flex items-end gap-8" style={{ perspective: 800 }}>
        <Cup face={cups[0]} spinning={spinning} />
        <Cup face={cups[1]} spinning={spinning} />
      </div>

      <div className="mt-12 flex min-h-[7rem] flex-col items-center justify-start">
        {phase === 'done' && result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div
              className="text-3xl tracking-[0.3em]"
              style={{ color: result === 'sheng' ? 'var(--color-cinnabar)' : 'var(--color-ink-soft)' }}
            >
              {JIAO_LABEL[result]}
            </div>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{JIAO_HINT[result]}</p>

            <div className="mt-7">
              {result === 'sheng' ? (
                <ActionButton
                  onClick={() => {
                    track(continueEvent, 'click', { stage: eventKey, trigger: 'click', signNo })
                    onApproved()
                  }}
                >
                  继 续
                </ActionButton>
              ) : result === 'yin' && onRejected ? (
                // 阴筊·确认阶段:神明不应许此签,放回签筒重抽
                <ActionButton variant="ghost" onClick={onRejected}>
                  签条放回 · 重新抽签
                </ActionButton>
              ) : (
                // 笑筊(圣意未明)及请示阶段的阴筊:诚心原地再掷(不埋点)
                <ActionButton variant="ghost" onClick={() => toss()}>
                  再 掷 一 次
                </ActionButton>
              )}
            </div>
          </motion.div>
        )}

        {phase !== 'done' && (
          <ActionButton onClick={() => toss('click')} disabled={spinning}>
            {spinning ? '掷 筊 中…' : '掷 筊'}
          </ActionButton>
        )}
      </div>

      {motionOk && phase === 'idle' && (
        <p className="mt-6 text-xs tracking-widest text-[var(--color-ink-soft)]/70">
          或 摇 一 摇 手 机
        </p>
      )}
    </Stage>
  )
}
