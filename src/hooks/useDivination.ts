import type { CupFace, JiaoResult } from '../types'

// 单只筊杯随机一面
function tossCup(): CupFace {
  return Math.random() < 0.5 ? 'yang' : 'yin'
}

// 掷筊:两只筊杯组合判定
// 一阴一阳 → 圣筊(应允, 50%)
// 两阳     → 笑筊(圣意不清, 25%)
// 两阴     → 阴筊(不应许, 25%)
export function tossJiao(): { cups: [CupFace, CupFace]; result: JiaoResult } {
  const cups: [CupFace, CupFace] = [tossCup(), tossCup()]
  let result: JiaoResult
  if (cups[0] !== cups[1]) result = 'sheng'
  else if (cups[0] === 'yang') result = 'xiao'
  else result = 'yin'
  return { cups, result }
}

// 抽签:随机 1..total
export function drawSign(total: number): number {
  return Math.floor(Math.random() * total) + 1
}

export const JIAO_LABEL: Record<JiaoResult, string> = {
  sheng: '圣筊',
  xiao: '笑筊',
  yin: '阴筊',
}

export const JIAO_HINT: Record<JiaoResult, string> = {
  sheng: '帝爷公应允',
  xiao: '圣意未明，请诚心再掷',
  yin: '神明暂未应许，请诚心再掷',
}
