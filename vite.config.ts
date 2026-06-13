import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // 预览工具通过 PORT 环境变量分配端口;有则严格使用,无则回退默认 5173
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    strictPort: !!process.env.PORT,
  },
})
