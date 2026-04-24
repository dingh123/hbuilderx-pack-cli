import readline from 'readline'
import { c, paint } from './logger.js'

export interface Device {
  id: string
  name: string
}

export type HbDevicePlatform = 'android' | 'ios-iPhone' | 'ios-simulator' | 'app-harmony'

const LINE_RE = /^(?:\d{1,2}:\d{2}:\d{2}(?:\.\d+)?\s+)?(.+?)[【\[](.+?)[】\]]\s*$/

export function parseDevices(raw: string): Device[] {
  const devices: Device[] = []
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const m = line.match(LINE_RE)
    if (!m) continue
    const name = m[1].trim()
    const id = m[2].trim()
    if (!id) continue
    devices.push({ id, name })
  }
  return devices
}

export function toHbPlatform(appPlatform: string, iosTarget?: string): HbDevicePlatform | undefined {
  switch (appPlatform) {
    case 'app-android': return 'android'
    case 'app-ios':     return iosTarget === 'simulator' ? 'ios-simulator' : 'ios-iPhone'
    case 'app-harmony': return 'app-harmony'
    default:            return undefined
  }
}

export async function promptSelectDevice(devices: Device[]): Promise<Device> {
  if (devices.length === 1) return devices[0]
  return process.stdin.isTTY ? promptInteractive(devices) : promptFallback(devices)
}

function promptInteractive(devices: Device[]): Promise<Device> {
  return new Promise<Device>(resolve => {
    const stdin  = process.stdin
    const stdout = process.stdout
    let index = 0
    let first = true

    const render = () => {
      if (!first) stdout.write(`\r\x1b[${devices.length + 1}A`)
      first = false
      stdout.write(`${paint(c.bold, '请选择设备：')}\x1b[K\n`)
      devices.forEach((d, i) => {
        const active = i === index
        const marker = active ? paint(c.cyan, '❯') : ' '
        const name   = active ? paint(c.cyan, d.name) : d.name
        stdout.write(`${marker} ${i + 1}) ${name}  ${paint(c.gray, `(${d.id})`)}\x1b[K\n`)
      })
      stdout.write(paint(c.gray, '  ↑/↓ 选择 · Enter 确认 · 数字快选 · Ctrl+C 取消') + '\x1b[K')
    }

    const cleanup = () => {
      stdin.removeListener('keypress', handler)
      if (stdin.isTTY) stdin.setRawMode(false)
      stdin.pause()
      stdout.write('\x1b[?25h\n')
    }

    const handler = (_str: string, key: readline.Key) => {
      if (!key) return

      if (key.ctrl && (key.name === 'c' || key.name === 'd')) {
        cleanup()
        process.exit(130)
      }

      if (key.name === 'up') {
        index = (index - 1 + devices.length) % devices.length
        render()
      } else if (key.name === 'down') {
        index = (index + 1) % devices.length
        render()
      } else if (key.name === 'return') {
        cleanup()
        resolve(devices[index])
      } else if (key.sequence && /^\d$/.test(key.sequence)) {
        const num = parseInt(key.sequence, 10)
        if (num >= 1 && num <= devices.length) {
          index = num - 1
          render()
          cleanup()
          resolve(devices[index])
        }
      }
    }

    readline.emitKeypressEvents(stdin)
    stdin.setRawMode(true)
    stdin.resume()
    stdout.write('\x1b[?25l')
    render()
    stdin.on('keypress', handler)
  })
}

async function promptFallback(devices: Device[]): Promise<Device> {
  console.log('\n检测到多台设备，请选择：')
  devices.forEach((d, i) => {
    console.log(`  ${i + 1}) ${d.name}  ${paint(c.gray, `(${d.id})`)}`)
  })

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const ask = (q: string) => new Promise<string>((resolve, reject) => {
    const onClose = () => reject(new Error('输入已取消'))
    rl.once('close', onClose)
    rl.question(q, answer => {
      rl.off('close', onClose)
      resolve(answer)
    })
  })

  try {
    while (true) {
      const answer = await ask(`\n输入编号 [1-${devices.length}]: `)
      const idx = parseInt(answer.trim(), 10) - 1
      if (idx >= 0 && idx < devices.length) return devices[idx]
      console.log(`${paint(c.yellow, '⚠')}  无效编号，请输入 1-${devices.length}`)
    }
  } finally {
    rl.close()
  }
}
