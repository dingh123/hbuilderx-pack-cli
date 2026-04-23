import { execSync } from 'child_process'
import fs from 'fs'

/** macOS 常见安装路径 */
const MAC_CLI_CANDIDATES = [
  '/Applications/HBuilderX.app/Contents/MacOS/cli',
  '/Applications/HBuilderX-Alpha.app/Contents/MacOS/cli',
]

/** Windows 常见安装路径 */
function getWindowsCliCandidates(): string[] {
  const localAppData = process.env.LOCALAPPDATA ?? 'C:\\Users\\Default\\AppData\\Local'
  const programFiles  = process.env.ProgramFiles   ?? 'C:\\Program Files'
  const programFilesX = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
  return [
    `${localAppData}\\Programs\\HBuilderX\\cli.exe`,
    `${programFiles}\\HBuilderX\\cli.exe`,
    `${programFilesX}\\HBuilderX\\cli.exe`,
    'D:\\HBuilderX\\cli.exe',
    'C:\\HBuilderX\\cli.exe',
  ]
}

function detectCliPath(): string {
  const platform = process.platform

  if (platform === 'darwin') {
    const found = MAC_CLI_CANDIDATES.find(p => fs.existsSync(p))
    return found ?? MAC_CLI_CANDIDATES[0]
  }

  if (platform === 'win32') {
    const found = getWindowsCliCandidates().find(p => fs.existsSync(p))
    return found ?? 'cli.exe'
  }

  return 'cli'
}

export function getCliPath(configPath?: string): string {
  if (configPath) return configPath
  if (process.env.HBUILDERX_CLI) return process.env.HBUILDERX_CLI
  return detectCliPath()
}

export function validateCliPath(cliPath: string): void {
  if (process.env.HBUILDERX_CLI) return

  // 如果是裸命令名（依赖 PATH），无法用 existsSync 检查，跳过文件校验
  const isBareCommand = !cliPath.includes('/') && !cliPath.includes('\\')
  if (isBareCommand) return

  if (!fs.existsSync(cliPath)) {
    const isWin = process.platform === 'win32'
    const candidates = isWin
      ? getWindowsCliCandidates().map(p => `  ${p}`).join('\n')
      : MAC_CLI_CANDIDATES.map(p => `  ${p}`).join('\n')

    throw new Error(
      `找不到 HBuilderX CLI: ${cliPath}\n\n` +
      `已尝试检测以下路径均不存在：\n${candidates}\n\n` +
      `解决方法（任选其一）：\n` +
      `  1. 在 uni-pack.config.json 中设置 hbuilderx.path\n` +
      `  2. 设置环境变量 HBUILDERX_CLI\n` +
      `  3. 将 HBuilderX 安装目录加入系统 PATH\n\n` +
      (isWin
        ? `Windows 示例: set HBUILDERX_CLI=D:\\HBuilderX\\cli.exe`
        : `macOS  示例: export HBUILDERX_CLI=/Applications/HBuilderX.app/Contents/MacOS/cli`)
    )
  }
}

function buildCmd(cliPath: string, args: string[]): string {
  const quotedArgs = args.map(a => (a.includes(' ') ? `"${a}"` : a)).join(' ')
  return `"${cliPath}" ${quotedArgs}`
}

function exec(cliPath: string, args: string[]): string {
  return execSync(buildCmd(cliPath, args), { encoding: 'utf-8' }) as string
}

function execInherited(cliPath: string, args: string[]): void {
  execSync(buildCmd(cliPath, args), { stdio: 'inherit' })
}

export function getVersion(cliPath: string): string {
  return exec(cliPath, ['ver']).trim()
}

export function getUserInfo(cliPath: string): string {
  return exec(cliPath, ['user', 'info']).trim()
}

export function isLoggedIn(userInfo: string): boolean {
  return !userInfo.includes('未登录') && !userInfo.includes('not logged in')
}

export function openHBuilderX(cliPath: string): void {
  try {
    exec(cliPath, ['open'])
  } catch {
    // HBuilderX 可能已在运行，忽略错误
  }
}

export function login(cliPath: string, username: string, password: string, global = false): string {
  const args = ['user', 'login', '--username', username, '--password', password]
  if (global) args.push('--global', 'true')
  return exec(cliPath, args).trim()
}

export function logout(cliPath: string): string {
  return exec(cliPath, ['user', 'logout']).trim()
}

export function packWithConfig(cliPath: string, configFilePath: string): void {
  execInherited(cliPath, ['pack', '--config', configFilePath])
}

export function publishApp(cliPath: string, platform: string, project: string, args: string[]): void {
  execInherited(cliPath, ['publish', '--platform', platform, '--project', project, ...args])
}

export function launchApp(cliPath: string, platform: string, project: string, args: string[]): void {
  execInherited(cliPath, ['launch', platform, '--project', project, ...args])
}

export function listDevices(cliPath: string): string {
  return exec(cliPath, ['devices', 'list']).trim()
}

export function cloudFunctions(cliPath: string, args: string[]): string {
  return exec(cliPath, ['cloud', 'functions', ...args]).trim()
}
