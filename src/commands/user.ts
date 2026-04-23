import { Command } from 'commander'
import { log } from '../core/logger.js'
import { getCliPath, getVersion, getUserInfo, isLoggedIn, login, logout, openHBuilderX } from '../core/hbuilderx.js'
import { loadConfig } from '../core/config.js'

function getCliFromOpts(opts: { config?: string; cwd?: string }) {
  const cwd = opts.cwd ?? process.cwd()
  let hbxPath: string | undefined
  try {
    const { config } = loadConfig(cwd, opts.config)
    hbxPath = config.hbuilderx?.path
  } catch {
    // 没有配置文件时使用默认路径
  }
  return getCliPath(hbxPath)
}

export function createUserCommand(): Command {
  const user = new Command('user').description('DCloud 用户账号管理')

  user
    .command('info')
    .description('查看当前登录用户信息')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { config?: string; cwd?: string }) => {
      const cliPath = getCliFromOpts(opts)
      try {
        const version  = getVersion(cliPath)
        const userInfo = getUserInfo(cliPath)
        log.meta({ 'CLI 版本': version, '登录状态': isLoggedIn(userInfo) ? '已登录' : '未登录' })
        console.log(userInfo)
      } catch (err) {
        log.error((err as Error).message)
        process.exit(1)
      }
    })

  user
    .command('login')
    .description('登录 DCloud 账号')
    .requiredOption('-u, --username <username>', '账号（邮箱/手机号）')
    .requiredOption('-p, --password <password>', '密码')
    .option('--global', '全局登录（HBuilderX 4.81+）')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { username: string; password: string; global?: boolean; config?: string; cwd?: string }) => {
      const cliPath = getCliFromOpts(opts)
      try {
        openHBuilderX(cliPath)
        const result = login(cliPath, opts.username, opts.password, opts.global ?? false)
        log.success('登录成功')
        if (result) log.dim(`  ${result}`)
      } catch (err) {
        log.error(`登录失败: ${(err as Error).message}`)
        process.exit(1)
      }
    })

  user
    .command('logout')
    .description('退出登录')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { config?: string; cwd?: string }) => {
      const cliPath = getCliFromOpts(opts)
      try {
        const result = logout(cliPath)
        log.success('已退出登录')
        if (result) log.dim(`  ${result}`)
      } catch (err) {
        log.error(`退出失败: ${(err as Error).message}`)
        process.exit(1)
      }
    })

  return user
}
