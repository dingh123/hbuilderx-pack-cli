import { Command } from 'commander'
import { log } from '../core/logger.js'
import { getCliPath, listDevices } from '../core/hbuilderx.js'
import { loadConfig } from '../core/config.js'

const SUPPORTED_DEVICE_PLATFORMS = ['android', 'ios-iPhone', 'ios-simulator', 'mp-harmony', 'app-harmony'] as const
type DevicePlatform = typeof SUPPORTED_DEVICE_PLATFORMS[number]

function isSupportedPlatform(p: string): p is DevicePlatform {
  return (SUPPORTED_DEVICE_PLATFORMS as readonly string[]).includes(p)
}

export function createDevicesCommand(): Command {
  return new Command('devices')
    .description('列出已连接的设备')
    .option('-p, --platform <platform>', `目标平台: ${SUPPORTED_DEVICE_PLATFORMS.join(' | ')}（默认 android）`)
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { platform?: string; config?: string; cwd?: string }) => {
      const cwd = opts.cwd ?? process.cwd()

      if (opts.platform && !isSupportedPlatform(opts.platform)) {
        log.error(`不支持的平台 "${opts.platform}"，可选: ${SUPPORTED_DEVICE_PLATFORMS.join(' | ')}`)
        process.exit(1)
      }

      let cliPath: string
      try {
        const { config } = loadConfig(cwd, opts.config)
        cliPath = getCliPath(config.hbuilderx?.path)
      } catch {
        cliPath = getCliPath()
      }

      try {
        const result = listDevices(cliPath, opts.platform)
        if (!result) {
          log.warn('没有检测到已连接的设备')
        } else {
          console.log(result)
        }
      } catch (err) {
        log.error(`获取设备列表失败: ${(err as Error).message}`)
        process.exit(1)
      }
    })
}
