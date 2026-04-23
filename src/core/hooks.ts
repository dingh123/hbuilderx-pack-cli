import { execSync } from 'child_process'
import { log } from './logger.js'
import type { HooksConfig } from '../types/config.js'

type HookName = keyof HooksConfig

function runCommand(cmd: string, cwd: string): void {
  log.dim(`  $ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd })
}

export function runHook(hooks: HooksConfig | undefined, name: HookName, cwd: string): void {
  if (!hooks) return
  const hook = hooks[name]
  if (!hook) return

  log.info(`执行钩子 ${name}`)
  const cmds = Array.isArray(hook) ? hook : [hook]
  for (const cmd of cmds) {
    try {
      runCommand(cmd, cwd)
    } catch {
      log.error(`钩子 ${name} 执行失败: ${cmd}`)
      process.exit(1)
    }
  }
}
