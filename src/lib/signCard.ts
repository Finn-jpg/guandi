import type { Sign } from '../types'

// 把一支签渲染成一张极简水墨签文卡(PNG Blob),供用户保存到相册/转发。
// 纯 Canvas 绘制,零依赖;窄高比例(840×1500≈0.56)贴近传统瘦长签纸,保证各机型清晰。

const PAPER = '#f4f1ea'
const INK = '#2b2826'
const INK_SOFT = '#6b645c'
const CINNABAR = '#9e3b2e'
const GOLD = '#b08d57'

const SERIF = '"Songti SC","STSong","SimSun","Noto Serif SC",serif'

export async function renderSignCard(sign: Sign): Promise<Blob> {
  const W = 840
  const H = 1500
  const cx = W / 2
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d 不可用')

  // 纸底
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // 双线内框:外墨细线 + 内朱砂更细线,克制的仪式感(收窄,贴近边)
  ctx.strokeStyle = withAlpha(INK, 0.18)
  ctx.lineWidth = 2
  ctx.strokeRect(54, 54, W - 108, H - 108)
  ctx.strokeStyle = withAlpha(CINNABAR, 0.5)
  ctx.lineWidth = 1.5
  ctx.strokeRect(70, 70, W - 140, H - 140)

  ctx.textAlign = 'center'

  // 签号
  ctx.fillStyle = INK
  ctx.textBaseline = 'middle'
  ctx.font = `500 56px ${SERIF}`
  ctx.fillText(`第 ${sign.no} 签`, cx, 214)

  // 干支
  if (sign.ganzhi) {
    ctx.fillStyle = INK_SOFT
    ctx.font = `400 32px ${SERIF}`
    ctx.fillText(spaced(sign.ganzhi), cx, 286)
  }

  // 吉凶朱砂方印
  if (sign.fortune) {
    ctx.font = `500 34px ${SERIF}`
    const tw = ctx.measureText(sign.fortune).width
    const padX = 24
    const sealW = tw + padX * 2
    const sealH = 66
    const sealCY = 358
    ctx.fillStyle = CINNABAR
    roundRect(ctx, cx - sealW / 2, sealCY - sealH / 2, sealW, sealH, 8)
    ctx.fill()
    ctx.fillStyle = PAPER
    ctx.textBaseline = 'middle'
    ctx.fillText(sign.fortune, cx, sealCY + 2)
  }

  // 签诗:按句拆列,右起,字符等距成网格(与签文页一致的排法)
  const verses = sign.poem
    .split(/[，,；;。.、！!？?\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (verses.length) {
    const charStep = 88
    const colStep = 126
    const nCols = verses.length
    const maxLen = Math.max(...verses.map((v) => [...v].length))
    const bandCenterY = 838
    const longestH = (maxLen - 1) * charStep
    const startY = bandCenterY - longestH / 2
    const rightX = cx + ((nCols - 1) * colStep) / 2

    ctx.fillStyle = INK
    ctx.font = `500 58px ${SERIF}`
    ctx.textBaseline = 'middle'
    verses.forEach((verse, i) => {
      const x = rightX - i * colStep
      ;[...verse].forEach((ch, j) => {
        ctx.fillText(ch, x, startY + j * charStep)
      })
    })
  }

  // 页脚:金色细分隔 + 落款
  ctx.strokeStyle = withAlpha(GOLD, 0.6)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - 56, 1320)
  ctx.lineTo(cx + 56, 1320)
  ctx.stroke()

  ctx.fillStyle = INK_SOFT
  ctx.textBaseline = 'middle'
  ctx.font = `400 28px ${SERIF}`
  ctx.fillText('关 帝 灵 签', cx, 1366)
  ctx.fillStyle = withAlpha(INK, 0.4)
  ctx.font = `400 22px ${SERIF}`
  ctx.fillText('www.qianyuqifu.com', cx, 1408)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('生成图片失败'))), 'image/png')
  })
}

// 字间加细空格,标题/干支更舒朗
function spaced(s: string): string {
  return [...s].join(' ')
}

function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
