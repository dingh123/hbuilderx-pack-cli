import { Command } from 'commander'
import { log } from '../core/logger.js'
import { getCliPath, validateCliPath, getVersion, getUserInfo, isLoggedIn } from '../core/hbuilderx.js'
import { loadConfig } from '../core/config.js'
import { checkCertFiles } from '../core/validator.js'

export function createDoctorCommand(): Command {
  return new Command('doctor')
    .description('检查 HBuilderX 环境、登录状态和证书文件')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { config?: string; cwd?: string }) => {
      const cwd = opts.cwd ?? process.cwd()
      let hasError = false

      log.divider('HBuilderX 环境诊断')
      console.log('')

      // 1. 尝试加载配置（可选）
      let config = {}
      let configPath = '（未找到配置文件）'
      try {
        const result = loadConfig(cwd, opts.config)
        config = result.config
        configPath = result.configPath
        log.success(`配置文件: ${configPath}`)
      } catch {
        log.warn('未找到配置文件，仅检查基础环境')
      }

      // 2. 检查 CLI 路径
      const cliPath = getCliPath((config as Record<string, unknown>).hbuilderx
        ? ((config as Record<string, unknown>).hbuilderx as Record<string, unknown>).path as string
        : undefined)
      log.step(1, `HBuilderX CLI 路径: ${cliPath}`)

      try {
        validateCliPath(cliPath)
        log.success('CLI 文件存在')
      } catch (err) {
        log.error((err as Error).message)
        hasError = true
      }

      // 3. 检查版本
      log.step(2, 'CLI 版本')
      try {
        const version = getVersion(cliPath)
        log.success(`版本: ${version}`)
      } catch {
        log.error('无法获取版本，请确认 HBuilderX 已正确安装')
        hasError = true
      }

      // 4. 检查登录状态
      log.step(3, '登录状态')
      try {
        const userInfo = getUserInfo(cliPath)
        if (isLoggedIn(userInfo)) {
          log.success(`已登录: ${userInfo}`)
        } else {
          log.error('未登录 DCloud 账号')
          log.dim('  请打开 HBuilderX 登录后重试')
          hasError = true
        }
      } catch {
        log.error('无法获取登录状态')
        hasError = true
      }

      // 5. 检查证书文件
      if (Object.keys(config).length > 0) {
        log.step(4, '证书文件检查')
        const certResults = checkCertFiles(config as Parameters<typeof checkCertFiles>[0])

        if (certResults.length === 0) {
          log.dim('  配置中无证书文件')
        } else {
          for (const item of certResults) {
            if (item.ok) {
              log.success(`${item.label}: ${item.path}`)
            } else {
              log.error(`${item.label} 文件不存在: ${item.path}`)
              hasError = true
            }
          }
        }
      }

      console.log('')
      if (hasError) {
        log.error('环境检查未通过，请修复以上问题后重试')
        process.exit(1)
      } else {
        log.success('环境检查通过，可以开始使用 uni-pack')
      }
    })
}
