import { motion } from 'framer-motion'
import { Stage, ActionButton } from './ui'
import { track, useShow } from '../lib/track'

export default function Welcome({ onStart }: { onStart: () => void }) {
  // 上香起卦曝光:分配新 session,后续埋点都带这个公参
  useShow('welcome_start', { stage: 'welcome', newSession: true })
  return (
    <Stage className="justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        {/* 印章式标题 */}
        <div className="mb-2 text-[var(--color-ink-soft)] tracking-[0.5em] text-sm">敬 求</div>
        <h1 className="text-6xl font-normal leading-tight tracking-[0.15em] text-[var(--color-ink)]">
          关帝
          <br />
          灵签
        </h1>
        <div className="mt-8 h-px w-16 bg-[var(--color-ink)]/20" />
        <p className="mt-8 max-w-[16rem] text-sm leading-7 text-[var(--color-ink-soft)]">
          静心凝神，默念所求之事
          <br />
          一时一事，诚则有应
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-16"
      >
        <ActionButton
          onClick={() => {
            track('welcome_start', 'click', { stage: 'welcome', trigger: 'click' })
            onStart()
          }}
        >
          上 香 起 卦
        </ActionButton>
      </motion.div>

      {/* 版本号:不打扰的角标,便于把线上行为对上发版 */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] tracking-widest text-[var(--color-ink-soft)]/40">
        v{__APP_VERSION__}
      </div>
    </Stage>
  )
}
