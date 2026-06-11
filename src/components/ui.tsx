import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// 统一的阶段切换容器(渐入渐出 + 轻微上浮)
export function Stage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-1 flex-col items-center px-7 ${className}`}
    >
      {children}
    </motion.section>
  )
}

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'solid' | 'ghost'
  disabled?: boolean
}

// 朱砂实心 / 描边幽灵 两种按钮
export function ActionButton({ children, onClick, variant = 'solid', disabled }: ButtonProps) {
  const base =
    'select-none rounded-full px-8 py-3 text-base tracking-[0.2em] transition active:scale-[0.97] disabled:opacity-40'
  const styles =
    variant === 'solid'
      ? 'bg-[var(--color-cinnabar)] text-[var(--color-paper)] shadow-[0_6px_20px_-8px_rgba(158,59,46,0.7)]'
      : 'border border-[var(--color-ink)]/25 text-[var(--color-ink)]'
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  )
}

// 朱砂小印章
export function Seal({ text }: { text: string }) {
  return (
    <span className="seal inline-flex items-center px-1.5 py-1 text-xs leading-none">{text}</span>
  )
}
