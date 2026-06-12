// 读取 Vercel 边缘节点注入的地理位置请求头,避免依赖国内不可达的第三方 IP 服务
export const config = { runtime: 'edge' }

export default function handler(req: Request): Response {
  const h = req.headers
  // x-vercel-ip-city 等值为 URL 编码(如中文城市名),需解码
  const decode = (v: string | null) => {
    if (!v) return null
    try {
      return decodeURIComponent(v)
    } catch {
      return v
    }
  }
  const num = (v: string | null) => {
    const n = v ? Number(v) : NaN
    return Number.isFinite(n) ? n : null
  }

  return Response.json(
    {
      ip: h.get('x-real-ip') ?? null,
      city: decode(h.get('x-vercel-ip-city')),
      region: decode(h.get('x-vercel-ip-country-region')),
      country: decode(h.get('x-vercel-ip-country')),
      latitude: num(h.get('x-vercel-ip-latitude')),
      longitude: num(h.get('x-vercel-ip-longitude')),
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
