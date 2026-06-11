import { useEffect, useRef } from 'react'

type DeviceMotionEventStatic = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

// iOS 13+ 需在用户手势中请求 DeviceMotion 授权
export async function requestMotionPermission(): Promise<boolean> {
  const DME = window.DeviceMotionEvent as DeviceMotionEventStatic | undefined
  if (!DME) return false
  if (typeof DME.requestPermission === 'function') {
    try {
      const res = await DME.requestPermission()
      return res === 'granted'
    } catch {
      return false
    }
  }
  // 非 iOS:无需授权
  return true
}

export function isMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window
}

interface UseShakeOptions {
  enabled: boolean
  threshold?: number   // 加速度差值阈值
  cooldownMs?: number  // 触发后的冷却,防抖
  onShake: () => void
}

// 监听摇动手势;enabled=false 时不挂载监听
export function useShake({ enabled, threshold = 16, cooldownMs = 1200, onShake }: UseShakeOptions) {
  const last = useRef({ x: 0, y: 0, z: 0, t: 0 })
  const lastFire = useRef(0)
  const cb = useRef(onShake)
  cb.current = onShake

  useEffect(() => {
    if (!enabled || !isMotionSupported()) return

    function handler(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return
      const now = Date.now()
      const prev = last.current
      if (prev.t === 0) {
        last.current = { x: acc.x, y: acc.y, z: acc.z, t: now }
        return
      }
      const dt = now - prev.t
      if (dt < 80) return
      const delta =
        Math.abs(acc.x - prev.x) + Math.abs(acc.y - prev.y) + Math.abs(acc.z - prev.z)
      last.current = { x: acc.x, y: acc.y, z: acc.z, t: now }
      if (delta > threshold && now - lastFire.current > cooldownMs) {
        lastFire.current = now
        cb.current()
      }
    }

    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [enabled, threshold, cooldownMs])
}
