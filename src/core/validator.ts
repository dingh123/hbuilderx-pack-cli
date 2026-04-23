import fs from 'fs'
import { log } from './logger.js'
import {
  getCliPath,
  validateCliPath,
  getVersion,
  getUserInfo,
  isLoggedIn,
  openHBuilderX,
} from './hbuilderx.js'
import type { UniPackConfig } from '../types/config.js'

export interface ValidateResult {
  cliPath: string
  version: string
  userInfo: string
}

/** 验证 HBuilderX 环境并返回 CLI 路径等信息，失败时直接 process.exit(1) */
export function validateEnvironment(config: UniPackConfig): ValidateResult {
  const cliPath = getCliPath(config.hbuilderx?.path)

  try {
    validateCliPath(cliPath)
  } catch (err) {
    log.error((err as Error).message)
    process.exit(1)
  }

  let version = ''
  try {
    version = getVersion(cliPath)
  } catch {
    log.error('无法获取 HBuilderX 版本，请确认 HBuilderX 已正确安装')
    log.info(`尝试运行: "${cliPath}" ver`)
    process.exit(1)
  }

  let userInfo = ''
  try {
    userInfo = getUserInfo(cliPath)
  } catch {
    log.warn('获取登录状态失败，尝试启动 HBuilderX...')
    openHBuilderX(cliPath)
    log.error('请先在 HBuilderX 中登录账号，再重新运行命令')
    process.exit(1)
  }

  if (!isLoggedIn(userInfo)) {
    log.error('未登录 DCloud 账号')
    log.info('请在 HBuilderX 中登录后重新运行')
    process.exit(1)
  }

  return { cliPath, version, userInfo }
}

/** 检查证书文件是否存在，返回检查结果列表 */
export interface CertCheckResult {
  label: string
  path: string
  ok: boolean
}

export function checkCertFiles(config: UniPackConfig): CertCheckResult[] {
  const results: CertCheckResult[] = []

  const check = (label: string, filePath: string | undefined) => {
    if (!filePath) return
    results.push({ label, path: filePath, ok: fs.existsSync(filePath) })
  }

  const android = config.pack?.android
  if (android?.certfile) {
    check('Android 证书', android.certfile)
  }

  const ios = config.pack?.ios
  if (ios) {
    check('iOS 证书 (直接)', ios.certfile)
    check('iOS 描述文件 (直接)', ios.profile)
    check('iOS 开发证书', ios.development?.certfile)
    check('iOS 开发描述文件', ios.development?.profile)
    check('iOS 发布证书', ios.distribution?.certfile)
    check('iOS 发布描述文件', ios.distribution?.profile)
  }

  const mpWeixin = config.publish?.['mp-weixin']
  if (mpWeixin?.privatekey) {
    check('微信小程序密钥', mpWeixin.privatekey)
  }

  const mpAlipay = config.publish?.['mp-alipay']
  if (mpAlipay?.privatekey) {
    check('支付宝小程序密钥', mpAlipay.privatekey)
  }

  return results
}
