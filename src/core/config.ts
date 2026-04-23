import fs from 'fs'
import path from 'path'
import type { UniPackConfig } from '../types/config.js'

const CONFIG_FILENAMES = [
  'uni-pack.config.json',
  '.unipackrc',
  '.unipackrc.json',
]

/** 替换字符串中的 ${ENV_VAR} 为环境变量值 */
function interpolateEnv(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
    const envVal = process.env[key]
    if (envVal === undefined) {
      throw new Error(`环境变量 \${${key}} 未设置`)
    }
    return envVal
  })
}

/** 递归处理对象中的所有字符串值，替换环境变量 */
function processEnvVars<T>(obj: T): T {
  if (typeof obj === 'string') {
    return interpolateEnv(obj) as unknown as T
  }
  if (Array.isArray(obj)) {
    return obj.map(item => processEnvVars(item)) as unknown as T
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = processEnvVars(val)
    }
    return result as T
  }
  return obj
}

/** 将路径统一转换为正斜杠（Windows 兼容） */
export function toUnixPath(p: string): string {
  return p.replace(/\\/g, '/')
}

/** 将配置中的相对路径解析为绝对路径 */
function resolveConfigPaths(config: UniPackConfig, baseDir: string): UniPackConfig {
  const resolve = (p: string | undefined) =>
    p ? toUnixPath(path.resolve(baseDir, p)) : undefined

  if (config.project) {
    config.project = toUnixPath(path.resolve(baseDir, config.project))
  }

  if (config.hbuilderx?.path) {
    config.hbuilderx.path = toUnixPath(path.resolve(baseDir, config.hbuilderx.path))
  }

  if (config.pack?.android) {
    const a = config.pack.android
    if (a.certfile) a.certfile = resolve(a.certfile)
  }

  if (config.pack?.ios) {
    const ios = config.pack.ios
    if (ios.certfile)  ios.certfile  = resolve(ios.certfile)
    if (ios.profile)   ios.profile   = resolve(ios.profile)
    if (ios.development) {
      const d = ios.development
      if (d.certfile) d.certfile = resolve(d.certfile)
      if (d.profile)  d.profile  = resolve(d.profile)
    }
    if (ios.distribution) {
      const d = ios.distribution
      if (d.certfile) d.certfile = resolve(d.certfile)
      if (d.profile)  d.profile  = resolve(d.profile)
    }
  }

  if (config.publish?.['mp-weixin']?.privatekey) {
    config.publish['mp-weixin'].privatekey = resolve(config.publish['mp-weixin'].privatekey)
  }

  if (config.publish?.['mp-alipay']?.privatekey) {
    config.publish['mp-alipay'].privatekey = resolve(config.publish['mp-alipay'].privatekey)
  }

  return config
}

export interface LoadConfigResult {
  config: UniPackConfig
  configPath: string
  configDir: string
}

export function loadConfig(cwd: string = process.cwd(), customPath?: string): LoadConfigResult {
  let configPath: string

  if (customPath) {
    configPath = path.resolve(cwd, customPath)
    if (!fs.existsSync(configPath)) {
      throw new Error(`配置文件不存在: ${configPath}`)
    }
  } else {
    const found = CONFIG_FILENAMES.map(name => path.join(cwd, name)).find(p => fs.existsSync(p))
    if (!found) {
      throw new Error(
        `未找到配置文件（查找路径：${cwd}）\n` +
        `支持的配置文件名：${CONFIG_FILENAMES.join(', ')}\n\n` +
        `运行 uni-pack init 创建配置文件`
      )
    }
    configPath = found
  }

  let raw: string
  try {
    raw = fs.readFileSync(configPath, 'utf-8')
  } catch (err) {
    throw new Error(`读取配置文件失败: ${(err as Error).message}`)
  }

  let config: UniPackConfig
  try {
    config = JSON.parse(raw)
  } catch (err) {
    throw new Error(`配置文件不是合法的 JSON: ${(err as Error).message}`)
  }

  const configDir = path.dirname(configPath)

  // 先解析路径（基于配置文件所在目录），再替换环境变量
  config = resolveConfigPaths(config, configDir)
  config = processEnvVars(config)

  return { config, configPath, configDir }
}

/** 自动补充 project 字段（未配置时使用 cwd） */
export function resolveProject(config: UniPackConfig, configDir: string): string {
  if (config.project) return config.project
  return toUnixPath(configDir) + '/'
}
