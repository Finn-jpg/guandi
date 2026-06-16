// 每日求签次数限制:每北京自然日每访客最多 3 次「完成的求签」(神佛钦定)
// 本期客户端实现(localStorage),符合"防多抽、求心诚"的温和约束;
// 硬性服务端校验等接入 AI/付费需要封顶成本时再加。

export const MAX_DRAWS_PER_DAY = 3

const STORAGE_KEY = 'guandi_draw_log'

// 北京时区的"今天"(YYYY-MM-DD);与服务端 at time zone 'Asia/Shanghai' 口径一致
function beijingToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())
}

interface DrawLog {
  date: string
  count: number
}

function readLog(): DrawLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const log = JSON.parse(raw) as DrawLog
      if (log.date === beijingToday()) return log
    }
  } catch {
    // 解析失败按 0 处理
  }
  return { date: beijingToday(), count: 0 }
}

// 今日已完成的求签次数(跨天自动归零)
export function getDrawsToday(): number {
  return readLog().count
}

export function remainingDraws(): number {
  return Math.max(0, MAX_DRAWS_PER_DAY - getDrawsToday())
}

export function canDraw(): boolean {
  return remainingDraws() > 0
}

// 完成一次求签时调用,计数 +1
export function recordDrawLocal(): void {
  try {
    const today = beijingToday()
    const log = readLog()
    const next: DrawLog = { date: today, count: log.count + 1 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 静默:计数失败不影响求签流程
  }
}
