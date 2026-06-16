import { createClient } from '@supabase/supabase-js'

// publishable key 本身即设计为可暴露在浏览器端(数据安全由 RLS 保证),
// 此处硬编码兜底,部署平台可用环境变量覆盖
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://vumcfikfbbhhrvximuay.supabase.co'
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_KRHkayGwg8hboPp8YVf23g_JQQbxy9y'

export const supabase = createClient(url, key)
