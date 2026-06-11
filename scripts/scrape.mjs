// 一次性爬虫:抓取 nongli.com 关帝灵签 100 签 → src/data/guandi.json
// 用法: npm run scrape
import { load } from 'cheerio'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'data', 'guandi.json')
const BASE = 'https://www.nongli.com/item5/guandi'
const TOTAL = 100
const DELAY_MS = 500

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 把一个 <p> 元素转成按 <br> 断行的纯文本行数组
function blockLines($, el) {
  let html = $(el).html() || ''
  html = html.replace(/<br\s*\/?>/gi, '\n')
  const text = load(`<div>${html}</div>`)('div').text()
  return text
    .replace(/ /g, ' ')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function fetchSign(no) {
  const res = await fetch(`${BASE}/${no}.html`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const html = buf.toString('utf-8')
  const $ = load(html)

  // 标题前缀不统一(关公灵签解签 / 关帝灵签),以"第X签"为锚点取其后干支与吉凶
  const title = $('.kingkuang').first().text().trim()
  const m = title.match(/第[一-龥]+签\s+(\S+)\s+(\S+)/)
  const ganzhi = m ? m[1] : ''
  const fortune = m ? m[2] : ''

  const sign = { no, ganzhi, fortune, poem: '' }
  let section = 'modern'

  $('.tujie_main > p').each((_, el) => {
    const lines = blockLines($, el)
    if (lines.length === 0) return
    const joined = lines.join('')

    // 分区标记
    if (joined.includes('现代白话文解签')) { section = 'modern'; return }
    if (joined.includes('传统版解签')) { section = 'trad'; return }
    if (joined.includes('占验')) { section = 'zhanyan'; return }
    if (joined.includes('相关故事')) { section = 'story'; return }

    // 诗曰 → 签诗
    if (lines[0] === '诗曰') {
      sign.poem = lines.slice(1).join('\n')
      return
    }

    const label = ($(el).find('strong').first().text() || '').trim()
    // 去掉首行的标签,得到正文
    let body = lines
    if (label && lines[0] === label) body = lines.slice(1)
    const text = body.join('\n').trim()
    if (!text) return

    if (section === 'story') {
      const name = label ? `${label}\n` : ''
      sign.story = (sign.story ? sign.story + '\n\n' : '') + name + text
      return
    }
    if (section === 'zhanyan') return

    switch (label) {
      case '解曰':
        if (section === 'modern' && !sign.jieyue) sign.jieyue = text
        break
      case '断曰':
        sign.duanyue = text
        break
      case '圣意':
        sign.shengyi = text
        break
      case '释义':
        sign.shiyi = text
        break
      case '解签':
        sign.jieqian = text
        break
      case '东坡解':
        sign.dongpo = text
        break
      case '碧仙注':
        sign.bixian = text
        break
    }
  })

  return sign
}

async function main() {
  const signs = []
  const failed = []
  for (let no = 1; no <= TOTAL; no++) {
    try {
      const s = await fetchSign(no)
      if (!s.poem) {
        console.warn(`签 ${no}: 警告 — 未解析到签诗`)
        failed.push(no)
      } else {
        console.log(`签 ${no} ✓ ${s.ganzhi} ${s.fortune}`)
      }
      signs.push(s)
    } catch (e) {
      console.error(`签 ${no}: 抓取失败 — ${e.message}`)
      failed.push(no)
    }
    await sleep(DELAY_MS)
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(signs, null, 2), 'utf-8')
  console.log(`\n已写入 ${signs.length} 条 → ${OUT}`)
  if (failed.length) console.warn(`需补抓的签号: ${failed.join(', ')}`)
}

main()
