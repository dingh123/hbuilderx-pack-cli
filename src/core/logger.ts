const ESC = '\x1b'
const c = {
  reset:  `${ESC}[0m`,
  bold:   `${ESC}[1m`,
  green:  `${ESC}[32m`,
  yellow: `${ESC}[33m`,
  red:    `${ESC}[31m`,
  cyan:   `${ESC}[36m`,
  blue:   `${ESC}[34m`,
  gray:   `${ESC}[90m`,
} as const

const paint = (color: string, msg: string) => `${color}${msg}${c.reset}`

export const log = {
  info(msg: string) {
    console.log(`${paint(c.cyan, 'ℹ')}  ${msg}`)
  },

  success(msg: string) {
    console.log(`${paint(c.green, '✓')}  ${paint(c.bold, msg)}`)
  },

  warn(msg: string) {
    console.warn(`${paint(c.yellow, '⚠')}  ${msg}`)
  },

  error(msg: string) {
    console.error(`${paint(c.red, '✗')}  ${msg}`)
  },

  dim(msg: string) {
    console.log(paint(c.gray, msg))
  },

  step(n: number, msg: string) {
    console.log(`  ${paint(c.blue, String(n) + '.')}  ${msg}`)
  },

  /** 打印 key-value 信息块 */
  meta(fields: Record<string, string | undefined>) {
    console.log('')
    const keyLen = Math.max(...Object.keys(fields).map(k => k.length))
    for (const [key, val] of Object.entries(fields)) {
      if (val == null) continue
      const pad = ' '.repeat(keyLen - key.length)
      console.log(`  ${paint(c.gray, key + pad)}  ${val}`)
    }
    console.log('')
  },

  /** 分隔线 */
  divider(title?: string) {
    if (title) {
      console.log(`\n${paint(c.bold, '── ' + title + ' ' + '─'.repeat(Math.max(0, 36 - title.length)))}`)
    } else {
      console.log(paint(c.gray, '─'.repeat(40)))
    }
  },

  /** 进度 spinner */
  progress(msg: string) {
    process.stdout.write(`${paint(c.cyan, '…')}  ${msg}`)
    const timer = setInterval(() => process.stdout.write('.'), 800)
    return () => {
      clearInterval(timer)
      process.stdout.write('\n')
    }
  },
}
