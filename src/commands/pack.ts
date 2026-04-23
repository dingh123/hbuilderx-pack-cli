import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { log } from '../core/logger.js'
import { packWithConfig } from '../core/hbuilderx.js'
import { loadConfig, resolveProject, toUnixPath } from '../core/config.js'
import { validateEnvironment } from '../core/validator.js'
import { runHook } from '../core/hooks.js'
import type { PackConfig, IOSCertProfile } from '../types/config.js'

type Platform = 'android' | 'ios' | 'all'

/** 将 channels 数组转为逗号分隔字符串 */
function normalizeChannels(channels: string | string[] | undefined): string | undefined {
  if (!channels) return undefined
  return Array.isArray(channels) ? channels.join(',') : channels
}

/** 根据 iscustom 选择 iOS 证书（兼容 development/distribution 模式） */
function resolveIOSCert(pack: PackConfig, iscustom: boolean): IOSCertProfile {
  const ios = pack.ios
  if (!ios) return {}

  // 优先使用命名证书配置
  if (ios.development || ios.distribution) {
    const certKey = iscustom ? 'development' : 'distribution'
    const cert = ios[certKey]
    if (cert) return cert
  }

  // 回退到直接配置
  return {
    profile:      ios.profile,
    certfile:     ios.certfile,
    certpassword: ios.certpassword,
  }
}

/** 构建发送给 HBuilderX CLI 的 pack config 对象 */
function buildHBuilderXConfig(
  project: string,
  platform: Platform,
  pack: PackConfig,
  overrides: { iscustom?: boolean; safemode?: boolean }
): Record<string, unknown> {
  const iscustom = overrides.iscustom ?? pack.iscustom ?? false
  const safemode = overrides.safemode ?? pack.safemode ?? true

  const hxPlatform = platform === 'all' ? 'ios,android' : platform

  const config: Record<string, unknown> = {
    project,
    platform: hxPlatform,
    iscustom,
    safemode,
    isconfusion: pack.isconfusion ?? false,
    splashads:   pack.splashads   ?? false,
    rpads:       pack.rpads       ?? false,
    pushads:     pack.pushads     ?? false,
    exchange:    pack.exchange    ?? false,
  }

  // Android
  if ((platform === 'android' || platform === 'all') && pack.android) {
    const a = pack.android
    config.android = {
      packagename:     a.packagename,
      androidpacktype: a.androidpacktype ?? '0',
      certalias:       a.certalias,
      certfile:        a.certfile,
      certpassword:    a.certpassword,
      storePassword:   a.storePassword,
      channels:        normalizeChannels(a.channels),
    }
  }

  // iOS
  if ((platform === 'ios' || platform === 'all') && pack.ios) {
    const ios = pack.ios
    const cert = resolveIOSCert(pack, iscustom)
    config.ios = {
      bundle:          ios.bundle,
      supporteddevice: ios.supporteddevice,
      profile:         cert.profile,
      certfile:        cert.certfile,
      certpassword:    cert.certpassword,
    }
  }

  return config
}

/** 将 pack config 写入临时文件，返回文件路径 */
function writeTempConfig(config: Record<string, unknown>): string {
  const tmpDir = path.join(os.tmpdir(), 'uni-pack-cli')
  fs.mkdirSync(tmpDir, { recursive: true })
  const tmpFile = path.join(tmpDir, `pack-${Date.now()}.json`)
  fs.writeFileSync(tmpFile, JSON.stringify(config, null, 2))
  return tmpFile
}

export function createPackCommand(): Command {
  return new Command('pack')
    .description('打包 App（Android / iOS）')
    .option('-p, --platform <platform>', '平台: android | ios | all', 'all')
    .option('--iscustom', '打自定义基座（默认：false）')
    .option('--no-safemode', '禁用安全模式')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: {
      platform: string
      iscustom?: boolean
      safemode?: boolean
      config?: string
      cwd?: string
    }) => {
      const cwd = opts.cwd ?? process.cwd()

      // 验证 platform 参数
      const platformArg = opts.platform as Platform
      if (!['android', 'ios', 'all'].includes(platformArg)) {
        log.error(`不支持的平台 "${opts.platform}"，可选：android | ios | all`)
        process.exit(1)
      }

      // 加载配置
      let loadResult: Awaited<ReturnType<typeof loadConfig>>
      try {
        loadResult = loadConfig(cwd, opts.config)
      } catch (err) {
        log.error((err as Error).message)
        process.exit(1)
      }

      const { config, configDir } = loadResult

      if (!config.pack) {
        log.error('配置文件中缺少 pack 配置')
        log.dim('  请在 uni-pack.config.json 中添加 "pack" 字段')
        process.exit(1)
      }

      // 验证环境
      const { cliPath, version, userInfo } = validateEnvironment(config)

      const project = resolveProject(config, configDir)
      const iscustom = opts.iscustom ?? config.pack.iscustom ?? false
      const safemode = opts.safemode ?? config.pack.safemode ?? true

      // 打印执行信息
      log.meta({
        '配置文件': loadResult.configPath,
        '项目路径': project,
        '平台':     platformArg === 'all' ? 'Android + iOS' : platformArg,
        '模式':     iscustom ? '自定义基座' : '正式打包',
        '安全模式': safemode ? '开启' : '关闭',
        'CLI 版本': version,
        '当前账号': userInfo,
      })

      // 构建 HBuilderX pack 配置
      const hxConfig = buildHBuilderXConfig(project, platformArg, config.pack, { iscustom, safemode })

      // 写入临时配置文件
      const tempConfigPath = writeTempConfig(hxConfig)
      log.dim(`  临时配置: ${tempConfigPath}`)

      // before:pack 钩子
      runHook(config.hooks, 'before:pack', configDir)

      log.divider('开始打包')

      try {
        packWithConfig(cliPath, tempConfigPath)
        console.log('')
        log.success('打包完成')
        // after:pack 钩子
        runHook(config.hooks, 'after:pack', configDir)
      } catch (err) {
        console.log('')
        log.error('打包失败')
        log.dim('  请检查：')
        log.dim('  1. 证书文件是否存在且有效')
        log.dim('  2. 配置文件中的证书信息是否正确')
        log.dim('  3. DCloud 账号是否有云打包配额')
        process.exit(1)
      } finally {
        // 清理临时配置（包含密码，不保留）
        try { fs.unlinkSync(tempConfigPath) } catch { /* ignore */ }
      }
    })
}
