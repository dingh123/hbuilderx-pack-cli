import { Command } from 'commander'
import { log } from '../core/logger.js'
import { getCliPath, listDevices } from '../core/hbuilderx.js'
import { loadConfig } from '../core/config.js'

export function createDevicesCommand(): Command {
  return new Command('devices')
    .description('列出已连接的设备')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { config?: string; cwd?: string }) => {
      const cwd = opts.cwd ?? process.cwd()
      let cliPath: string
      try {
        const { config } = loadConfig(cwd, opts.config)
        cliPath = getCliPath(config.hbuilderx?.path)
      } catch {
        cliPath = getCliPath()
      }

      try {
        const result = listDevices(cliPath)
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
