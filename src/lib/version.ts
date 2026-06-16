// 应用版本号:由 vite.config 的 define 注入 __APP_VERSION__(来自 package.json)。
// 加 typeof 兜底:个别情况下(如 dev server 未重载配置)未注入时回退,避免白屏。
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
