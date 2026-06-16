import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Sign } from '../types'
import { TOPICS, FREEFORM_PROMPT, type Topic } from '../data/topics'
import { getVisitorId } from '../lib/visitor'
import { track, useShow } from '../lib/track'
import { ActionButton } from './ui'

type Phase = 'idle' | 'topic' | 'questions' | 'streaming' | 'done' | 'error' | 'limit'

// 免责声明:产品侧固定提示,AI 内容请谨慎辨别
const DISCLAIMER =
  '本解读由 AI 依签文生成,仅供参考启发,不构成医疗、投资、法律等专业建议;心诚则灵,凡事自有定夺。'

export default function AiInterpret({ sign }: { sign: Sign }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [freeform, setFreeform] = useState('')
  const [content, setContent] = useState('')
  const [errMsg, setErrMsg] = useState('')

  // AI 解签入口曝光
  useShow('ai_interpret', { stage: 'result', signNo: sign.no })

  const requiredOk = topic
    ? topic.questions.every((q, i) => !q.required || (answers[i]?.trim() ?? '') !== '')
    : false

  function reset() {
    setTopic(null)
    setAnswers({})
    setFreeform('')
    setContent('')
    setErrMsg('')
  }

  async function generate() {
    if (!topic) return
    track('ai_interpret', 'click', { stage: 'result', trigger: 'click', signNo: sign.no })
    const ans = topic.questions.map((q, i) => ({ ask: q.ask, value: answers[i] ?? '' }))
    setContent('')
    setErrMsg('')
    setPhase('streaming')
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: getVisitorId(),
          sign: {
            no: sign.no,
            ganzhi: sign.ganzhi,
            fortune: sign.fortune,
            poem: sign.poem,
            jieyue: sign.jieyue,
          },
          topic: topic.label,
          answers: ans,
          freeform,
        }),
      })
      if (res.status === 429) {
        setPhase('limit')
        return
      }
      const ct = res.headers.get('content-type') ?? ''
      if (!res.ok || !res.body || !ct.includes('text/plain')) {
        let m = '解签师正在闭关,请稍候再试'
        try {
          const j = await res.json()
          if (j?.message) m = j.message
        } catch {
          // 忽略
        }
        setErrMsg(m)
        setPhase('error')
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setContent(text)
      }
      setPhase('done')
    } catch {
      setErrMsg('网络不太顺,请稍候再试')
      setPhase('error')
    }
  }

  return (
    <div className="mt-10 border-t border-[var(--color-ink)]/10 pt-8">
      <AnimatePresence mode="wait">
        {/* 入口 */}
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <ActionButton onClick={() => setPhase('topic')}>问 神 明 · AI 解 签</ActionButton>
            <p className="mt-4 text-xs tracking-widest text-[var(--color-ink-soft)]/60">
              说说你所求之事,得一段贴心解读
            </p>
          </motion.div>
        )}

        {/* 选门类 */}
        {phase === 'topic' && (
          <motion.div key="topic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-5 text-center text-sm tracking-[0.2em] text-[var(--color-ink)]">
              你想问的是哪一类?
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    reset()
                    setTopic(t)
                    setPhase('questions')
                  }}
                  className="rounded-full border border-[var(--color-ink)]/25 px-4 py-1.5 text-sm tracking-widest text-[var(--color-ink)] transition active:scale-95"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 引导问答 */}
        {phase === 'questions' && topic && (
          <motion.div key="questions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-6 text-center text-sm tracking-[0.2em] text-[var(--color-cinnabar)]">
              {topic.label}
            </p>
            <div className="flex flex-col gap-6">
              {topic.questions.map((q, i) => (
                <div key={i}>
                  <p className="mb-2.5 text-sm text-[var(--color-ink)]">
                    {q.ask}
                    {!q.required && (
                      <span className="ml-2 text-xs text-[var(--color-ink-soft)]/50">选填</span>
                    )}
                  </p>
                  {q.type === 'chips' && q.options ? (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const active = answers[i] === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                            className={`rounded-full px-3.5 py-1.5 text-sm tracking-wide transition active:scale-95 ${
                              active
                                ? 'bg-[var(--color-cinnabar)] text-[var(--color-paper)]'
                                : 'border border-[var(--color-ink)]/25 text-[var(--color-ink)]'
                            }`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={answers[i] ?? ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-ink)]/20 bg-transparent px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-cinnabar)]/50"
                      placeholder="可一句话说说…"
                    />
                  )}
                </div>
              ))}

              {/* 全局自由补充 */}
              <div>
                <p className="mb-2.5 text-sm text-[var(--color-ink)]">{FREEFORM_PROMPT}</p>
                <textarea
                  value={freeform}
                  onChange={(e) => setFreeform(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--color-ink)]/20 bg-transparent px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-cinnabar)]/50"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <ActionButton onClick={generate} disabled={!requiredOk}>
                请 神 明 解 签
              </ActionButton>
              <button
                type="button"
                onClick={() => setPhase('topic')}
                className="text-xs tracking-widest text-[var(--color-ink-soft)]/60"
              >
                ← 换个方向
              </button>
            </div>
          </motion.div>
        )}

        {/* 流式 / 完成 */}
        {(phase === 'streaming' || phase === 'done') && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="mb-5 text-center text-sm tracking-[0.2em] text-[var(--color-cinnabar)]">
              {topic?.label} · 解签
            </p>
            {content ? (
              <p className="whitespace-pre-line text-[15px] leading-8 text-[var(--color-ink-soft)]">
                {content}
                {phase === 'streaming' && <span className="animate-pulse">▍</span>}
              </p>
            ) : (
              <p className="text-center text-sm text-[var(--color-ink-soft)]/70">解签师执笔中…</p>
            )}
            {phase === 'done' && (
              <>
                <p className="mt-6 text-[11px] leading-5 text-[var(--color-ink-soft)]/50">
                  {DISCLAIMER}
                </p>
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setPhase('topic')}
                    className="text-xs tracking-widest text-[var(--color-ink-soft)]/60"
                  >
                    换个方向再问
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* 达到每日上限 */}
        {phase === 'limit' && (
          <motion.div
            key="limit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-sm leading-7 text-[var(--color-ink-soft)]">
              今日解签已达上限
              <br />
              心诚则灵,明日再来
            </p>
          </motion.div>
        )}

        {/* 出错 */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="mb-4 text-sm text-[var(--color-ink-soft)]">{errMsg}</p>
            <ActionButton variant="ghost" onClick={generate}>
              再 试 一 次
            </ActionButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
