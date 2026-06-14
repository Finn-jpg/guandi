import { useEffect, useRef } from 'react'
import type { Stage } from '../types'
import { supabase } from './supabase'
import { getVisitorId } from './visitor'

// 9 个按钮的事件名(两个"继续"、两个"掷茭"用 ask_/confirm_ 前缀区分)
export type EventName =
  | 'welcome_start'
  | 'ask_toss'
  | 'ask_continue'
  | 'draw'
  | 'confirm_toss'
  | 'confirm_continue'
  | 'result_thanks'
  | 'share'
  | 'again'

export type EventType = 'show' | 'click'
export type Trigger = 'click' | 'shake'

// 一次求签会话:welcome_start 曝光时分配,后续全程复用;点"再求一签"回 welcome 即开新会话
let sessionId: string | null = null

export function startSession(): string {
  sessionId = crypto.randomUUID()
  return sessionId
}

function getSessionId(): string {
  if (!sessionId) sessionId = crypto.randomUUID()
  return sessionId
}

interface TrackExtra {
  trigger?: Trigger // 仅 click 事件用;show 不传(落库为 null)
  stage?: Stage
  signNo?: number
}

// 上报一条事件,fire-and-forget,失败静默,绝不阻塞 UI
export function track(name: EventName, type: EventType, extra: TrackExtra = {}) {
  // supabase 查询是惰性 thenable,必须 .then() 才会真正发请求;两个回调都吞掉,不 await
  supabase
    .rpc('log_event', {
      _session_id: getSessionId(),
      _visitor_id: getVisitorId(),
      _event_name: name,
      _event_type: type,
      _trigger: extra.trigger ?? null,
      _stage: extra.stage ?? null,
      _sign_no: extra.signNo ?? null,
      _client_ts: new Date().toISOString(),
    })
    .then(
      () => {},
      () => {},
    )
}

interface ShowExtra {
  stage?: Stage
  signNo?: number
  newSession?: boolean // welcome_start 曝光时置 true:先开新会话,再上报本条 show
}

// 曝光:组件 mount 时打一次 show(ref 去重,StrictMode 双调用与重渲染均不会重复)
export function useShow(name: EventName, extra: ShowExtra = {}) {
  const fired = useRef(false)
  const { stage, signNo, newSession } = extra
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    if (newSession) startSession()
    track(name, 'show', { stage, signNo })
    // 仅在 mount 时触发一次,故意不依赖 extra
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
