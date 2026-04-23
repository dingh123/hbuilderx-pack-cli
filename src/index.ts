export type {
  UniPackConfig,
  HBuilderXConfig,
  PackConfig,
  AndroidConfig,
  IOSConfig,
  IOSCertProfile,
  H5PublishConfig,
  MpPublishConfig,
  PublishConfig,
  HooksConfig,
} from './types/config.js'

export { loadConfig, resolveProject, toUnixPath } from './core/config.js'
export { log } from './core/logger.js'
export {
  getCliPath,
  validateCliPath,
  getVersion,
  getUserInfo,
  isLoggedIn,
  openHBuilderX,
  login,
  logout,
  packWithConfig,
  publishApp,
  launchApp,
  listDevices,
  cloudFunctions,
} from './core/hbuilderx.js'
export { validateEnvironment, checkCertFiles } from './core/validator.js'
export type { ValidateResult, CertCheckResult } from './core/validator.js'
export { runHook } from './core/hooks.js'
