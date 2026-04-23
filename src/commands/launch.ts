import { Command } from 'commander'
import { log } from '../core/logger.js'
import { launchApp } from '../core/hbuilderx.js'
import { loadConfig, resolveProject } from '../core/config.js'
import { validateEnvironment } from '../core/validator.js'

const SUPPORTED_PLATFORMS = ['app-android', 'app-ios', 'app-harmony'] as const
type LaunchPlatform = typeof SUPPORTED_PLATFORMS[number]

export function createLaunchCommand(): Command {
  return new Command('launch')
    .description('在设备或模拟器上运行项目')
    .requiredOption('-p, --platform <platform>', `目标平台: ${SUPPORTED_PLATFORMS.join(' | ')}`)
    .option('--device-id <id>', '设备序列号')
    .option('--ios-target <target>', 'iOS 目标: device | simulator')
    .option('--playground <type>', 'playground 类型: standard | custom')
    .option('--native-log', '显示原生日志')
    .option('--clean-cache', '清除缓存')
    .option('--compile-only', '仅编译不运行')
    .option('--page-path <path>', '启动页面路径')
    .option('--page-query <query>', '启动页面参数')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: Record<string, string | boolean | undefined>) => {
      const cwd = (opts.cwd as string) ?? process.cwd()
      const platform = (opts.platform as string).toLowerCase() as LaunchPlatform

      if (!SUPPORTED_PLATFORMS.includes(platform)) {
        log.error(`不支持的平台 "${opts.platform}"，可选: ${SUPPORTED_PLATFORMS.join(' | ')}`)
        process.exit(1)
      }

      let loadResult: ReturnType<typeof loadConfig>
      try {
        loadResult = loadConfig(cwd, opts.config as string | undefined)
      } catch (err) {
        log.error((err as Error).message)
        process.exit(1)
      }

      const { config, configDir } = loadResult
      const { cliPath } = validateEnvironment(config)
      const project = resolveProject(config, configDir)

      const args: string[] = []
      const add = (flag: string, val: string | boolean | undefined) => {
        if (val == null) return
        args.push(flag, String(val))
      }

      add('--deviceId',        opts.deviceId)
      add('--iosTarget',       opts.iosTarget)
      add('--playground',      opts.playground)
      add('--native-log',      opts.nativeLog)
      add('--cleanCache',      opts.cleanCache)
      add('--compile',         opts.compileOnly)
      add('--pagePath',        opts.pagePath)
      add('--pageQuery',       opts.pageQuery)

      log.meta({
        '项目路径': project,
        '平台':     platform,
        '设备':     (opts.deviceId as string) ?? '默认',
      })
      log.divider('开始运行')

      try {
        launchApp(cliPath, platform, project, args)
      } catch {
        log.error('运行失败，请检查设备连接和项目配置')
        process.exit(1)
      }
    })
}
