import { motion } from 'framer-motion'
import { Stage, ActionButton } from './ui'

export default function Closing({ onAgain }: { onAgain: () => void }) {
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

      <div className="mt-14">
        <ActionButton variant="ghost" onClick={onAgain}>
          再 求 一 签
        </ActionButton>
      </div>
    </Stage>
  )
}
