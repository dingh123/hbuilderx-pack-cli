import { Command } from 'commander'
import { log } from '../core/logger.js'
import { publishApp } from '../core/hbuilderx.js'
import { loadConfig, resolveProject } from '../core/config.js'
import { validateEnvironment } from '../core/validator.js'
import { runHook } from '../core/hooks.js'

type PublishPlatform = 'h5' | 'mp-weixin' | 'mp-alipay' | 'app-android' | 'app-ios' | 'app-harmony'

const PLATFORM_ALIASES: Record<string, string> = {
  'h5':           'H5',
  'web':          'H5',
  'mp-weixin':    'MP-WEIXIN',
  'mp-wechat':    'MP-WEIXIN',
  'mp-alipay':    'MP-ALIPAY',
  'app-android':  'app-android',
  'app-ios':      'app-ios',
  'app-harmony':  'app-harmony',
}

function buildH5Args(config: Record<string, unknown>, overrides: Record<string, string | boolean | undefined>): string[] {
  const args: string[] = []
  const add = (flag: string, val: string | boolean | undefined) => {
    if (val == null) return
    args.push(flag, String(val))
  }

  add('--provider',    overrides.provider    ?? config.provider as string)
  add('--spaceId',     overrides.spaceId     ?? config.spaceId as string)
  add('--webDomain',   overrides.webDomain   ?? config.webDomain as string)
  add('--webTitle',    overrides.webTitle    ?? config.webTitle as string)
  add('--webHosting',  overrides.webHosting  ?? config.webHosting as boolean)
  add('--ssr',         overrides.ssr         ?? config.ssr as boolean)
  add('--ssrHost',     overrides.ssrHost     ?? config.ssrHost as string)
  add('--ssrProvider', overrides.ssrProvider ?? config.ssrProvider as string)

  return args
}

function buildMpArgs(config: Record<string, unknown>, overrides: Record<string, string | boolean | undefined>): string[] {
  const args: string[] = []
  const add = (flag: string, val: string | boolean | undefined) => {
    if (val == null) return
    args.push(flag, String(val))
  }

  add('--appid',       overrides.appid       ?? config.appid as string)
  add('--privatekey',  overrides.privatekey  ?? config.privatekey as string)
  add('--version',     overrides.version     ?? config.version as string)
  add('--description', overrides.description ?? config.description as string)
  add('--upload',      overrides.upload      ?? config.upload as boolean)
  add('--robot',       overrides.robot       ?? config.robot as string)
  add('--sourceMap',   overrides.sourceMap   ?? config.sourceMap as boolean)
  add('--subPackage',  overrides.subPackage  ?? config.subPackage as string)

  return args
}

export function createPublishCommand(): Command {
  return new Command('publish')
    .description('发布项目（H5 / 小程序 / App 资源包）')
    .requiredOption('-p, --platform <platform>', '平台: h5 | mp-weixin | mp-alipay | app-android | app-ios | app-harmony')
    .option('--appid <appid>', '小程序 AppID（覆盖配置）')
    .option('--privatekey <path>', '上传密钥文件路径（覆盖配置）')
    .option('--version <version>', '版本号（覆盖配置）')
    .option('--description <desc>', '上传备注（覆盖配置）')
    .option('--upload', '自动上传（小程序）')
    .option('--robot <n>', '微信 CI 机器人编号 (1-30)')
    .option('--source-map', '生成 SourceMap')
    .option('--sub-package <name>', '分包名称')
    .option('--provider <provider>', 'H5 云服务商: aliyun | alipay | tcb')
    .option('--space-id <id>', 'H5 云空间 ID')
    .option('--web-domain <domain>', 'H5 网站域名')
    .option('--web-title <title>', 'H5 网站标题')
    .option('--web-hosting', 'H5 上传到前端网页托管')
    .option('--ssr', 'H5 SSR 模式')
    .option('--ssr-host <host>', 'H5 SSR 域名')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: Record<string, string | boolean | undefined>) => {
      const cwd = (opts.cwd as string) ?? process.cwd()
      const platformInput = (opts.platform as string).toLowerCase()
      const hxPlatform = PLATFORM_ALIASES[platformInput]

      if (!hxPlatform) {
        log.error(`不支持的平台 "${opts.platform}"`)
        log.dim(`  可选：${Object.keys(PLATFORM_ALIASES).join(' | ')}`)
        process.exit(1)
      }

      // 加载配置
      let loadResult: ReturnType<typeof loadConfig>
      try {
        loadResult = loadConfig(cwd, opts.config as string | undefined)
      } catch (err) {
        log.error((err as Error).message)
        process.exit(1)
      }

      const { config, configDir } = loadResult

      // 验证环境
      const { cliPath, version, userInfo } = validateEnvironment(config)

      const project = resolveProject(config, configDir)

      log.meta({
        '配置文件': loadResult.configPath,
        '项目路径': project,
        '平台':     hxPlatform,
        'CLI 版本': version,
        '当前账号': userInfo,
      })

      // 构建参数
      let extraArgs: string[] = []

      if (platformInput === 'h5' || platformInput === 'web') {
        const platformConfig = (config.publish?.h5 ?? {}) as Record<string, unknown>
        extraArgs = buildH5Args(platformConfig, opts as Record<string, string | boolean | undefined>)
      } else if (platformInput.startsWith('mp-')) {
        const platformConfig = ((config.publish?.[platformInput as keyof typeof config.publish]) ?? {}) as Record<string, unknown>
        extraArgs = buildMpArgs(platformConfig, opts as Record<string, string | boolean | undefined>)
      }

      // before:publish 钩子
      runHook(config.hooks, 'before:publish', configDir)

      log.divider('开始发布')

      try {
        publishApp(cliPath, hxPlatform, project, extraArgs)
        console.log('')
        log.success('发布完成')
        // after:publish 钩子
        runHook(config.hooks, 'after:publish', configDir)
      } catch {
        console.log('')
        log.error('发布失败')
        log.dim('  请检查配置参数是否正确')
        process.exit(1)
      }
    })
}
