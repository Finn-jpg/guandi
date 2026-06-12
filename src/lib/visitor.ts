import { supabase } from './supabase'
import type { Sign } from '../types'

const STORAGE_KEY = 'guandi_visitor_id'

// 无登录体系:以 localStorage 中的匿名 UUID 标识同一浏览器的访客
export function getVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

interface Geo {
  ip: string | null
  city: string | null
  region: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

const EMPTY_GEO: Geo = {
  ip: null,
  city: null,
  region: null,
  country: null,
  latitude: null,
  longitude: null,
}

// 浏览器端拿不到自身公网 IP:线上首选同源 /api/geo(读 Vercel 地理头,
// 国内可达);本地开发或失败时降级到第三方源,均失败则回退空值
async function fetchGeo(): Promise<Geo> {
  try {
    const res = await fetch('/api/geo', { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const j = await res.json()
      if (j && typeof j === 'object' && 'ip' in j) return { ...EMPTY_GEO, ...j }
    }
  } catch {
    // 本地开发无此接口,降级
  }
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(6000) })
    const j = await res.json()
    if (j?.success !== false) {
      return {
        ip: j.ip ?? null,
        city: j.city ?? null,
        region: j.region ?? null,
        country: j.country ?? null,
        latitude: j.latitude ?? null,
        longitude: j.longitude ?? null,
      }
    }
  } catch {
    // 降级到备用源
  }
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(6000) })
    const j = await res.json()
    return {
      ip: j.ip ?? null,
      city: j.city ?? null,
      region: j.region ?? null,
      country: j.country_name ?? null,
      latitude: j.latitude ?? null,
      longitude: j.longitude ?? null,
    }
  } catch {
    return EMPTY_GEO
  }
}

// 上报访客(IP/地理位置/UA);失败静默,绝不阻塞仪式流程
export async function trackVisit(): Promise<void> {
  try {
    const geo = await fetchGeo()
    await supabase.rpc('track_visit', {
      _id: getVisitorId(),
      _ip: geo.ip,
      _city: geo.city,
      _region: geo.region,
      _country: geo.country,
      _latitude: geo.latitude,
      _longitude: geo.longitude,
      _user_agent: navigator.userAgent.slice(0, 500),
    })
  } catch {
    // 静默
  }
}

// 落一条求签记录(确认筊通过、签为"神佛钦定"时调用)
export async function recordDraw(sign: Sign): Promise<void> {
  try {
    await supabase.rpc('record_draw', {
      _user_id: getVisitorId(),
      _sign_no: sign.no,
      _ganzhi: sign.ganzhi,
      _fortune: sign.fortune,
    })
  } catch {
    // 静默
  }
}
