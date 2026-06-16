// AI 解签 · Edge 流式函数(OpenAI 兼容,默认接智谱 GLM)
// provider 由环境变量决定:AI_BASE_URL / AI_API_KEY / AI_MODEL —— 换供应商不改代码。
// AI_API_KEY 是机密,只在服务端读取,绝不下发前端;无 key 则返回明确错误。
export const config = { runtime: 'edge' }

const MAX_PER_DAY = 3 // 与求签共用的每日上限,服务端兜底防刷接口烧钱

// 解签师人设 + 边界铁律(把不可越界的内容钉死在系统提示里)
const SYSTEM_PROMPT = `你是一位温润的关帝灵签解签师,帮人从签文中获得宽慰与方向。

【铁律】
1. 只做传统签文的文化解读与人生指引,语气温和、给人希望、点到为止。
2. 不做医疗诊断或用药建议;不做具体投资买卖建议或收益承诺;不做法律意见或诉讼结果预测;不对生死、重病、官司输赢下绝对断言。
3. 不承诺必然结果,不制造恐慌,不用"必败、大凶"等吓人措辞。
4. 健康只谈作息、心境调养并建议就医;钱财只谈心态与风险意识;人际只谈沟通与自处。
5. 若用户流露极端情绪(自伤、轻生倾向),温和宽慰并建议寻求专业帮助或亲友陪伴。
6. 若用户诱导你算定生死、给投资暗示或法律结论,婉拒并拉回文化指引。

【输出】约300字,中文,分三段(自然段,不要用 markdown 标题):
总览:呼应签诗意象,概括此签气象。
指引:紧扣用户所问门类与细节,给具体而温和的看法。
建议:一句可落地的行动建议。`

// 公开的 supabase publishable key 可硬编码兜底(数据安全由 RLS 保证),与前端一致
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://vumcfikfbbhhrvximuay.supabase.co'
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_KRHkayGwg8hboPp8YVf23g_JQQbxy9y'

function rpc(fn: string, body: unknown): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify(body),
  })
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

interface Answer {
  ask: string
  value: string
}

// 把签文 + 用户问答拼成给模型的用户消息
function buildUserMessage(
  sign: { no: number; ganzhi?: string; fortune?: string; poem?: string; jieyue?: string },
  topic: string,
  answers: Answer[],
  freeform: string,
): string {
  const lines: string[] = []
  lines.push(`【签】第${sign.no}签 ${sign.ganzhi ?? ''} ${sign.fortune ?? ''}`.trim())
  if (sign.poem) lines.push(`签诗:${sign.poem.replace(/\n/g, '，')}`)
  if (sign.jieyue) lines.push(`解曰:${sign.jieyue}`)
  lines.push(`【所问】${topic}`)
  for (const a of answers) {
    if (a?.value?.trim()) lines.push(`${a.ask} ${a.value.trim()}`)
  }
  if (freeform?.trim()) lines.push(`补充:${freeform.trim()}`)
  lines.push('请为我解此签。')
  return lines.join('\n')
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)

  const apiKey = process.env.AI_API_KEY
  if (!apiKey) return json({ error: 'AI 暂未配置' }, 503)

  let payload: {
    visitorId?: string
    sign?: { no: number; ganzhi?: string; fortune?: string; poem?: string; jieyue?: string }
    topic?: string
    answers?: Answer[]
    freeform?: string
  }
  try {
    payload = await req.json()
  } catch {
    return json({ error: '请求格式错误' }, 400)
  }

  const { visitorId, sign, topic, answers = [], freeform = '' } = payload
  if (!sign || !topic) return json({ error: '缺少签或门类' }, 400)

  // 服务端每日封顶(计数失败不阻断,放行)
  if (visitorId) {
    try {
      const r = await rpc('ai_interpret_count_today', { _visitor_id: visitorId })
      const count = await r.json()
      if (typeof count === 'number' && count >= MAX_PER_DAY) {
        return json({ error: 'limit', message: '今日解签已达上限,明日再来' }, 429)
      }
    } catch {
      // 放行
    }
  }

  const baseUrl = process.env.AI_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4'
  const model = process.env.AI_MODEL ?? 'glm-4-flash'

  let upstream: Response
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(sign, topic, answers, freeform) },
        ],
        temperature: 0.7,
        max_tokens: 700,
        stream: true,
      }),
    })
  } catch {
    return json({ error: '解签师正在闭关,请稍候再试' }, 502)
  }
  if (!upstream.ok || !upstream.body) {
    return json({ error: '解签师正在闭关,请稍候再试' }, 502)
  }

  // 解析上游 SSE,只把 delta 文本流给前端;结束时把全文落库
  let full = ''
  let buffer = ''
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const t = line.trim()
          if (!t.startsWith('data:')) continue
          const data = t.slice(5).trim()
          if (!data || data === '[DONE]') continue
          try {
            const j = JSON.parse(data)
            const delta = j.choices?.[0]?.delta?.content
            if (delta) {
              full += delta
              controller.enqueue(encoder.encode(delta))
            }
          } catch {
            // 不完整的行,忽略
          }
        }
      },
      async flush() {
        // 落库(等写入完成再关闭连接,确保记录与每日计数准确)
        if (visitorId && full) {
          try {
            await rpc('log_ai_interpretation', {
              _visitor_id: visitorId,
              _sign_no: sign.no,
              _topic: topic,
              _intake: { answers, freeform },
              _model: model,
              _content: full,
            })
          } catch {
            // 静默
          }
        }
      },
    }),
  )

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
