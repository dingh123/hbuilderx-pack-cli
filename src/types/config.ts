// ---- HBuilderX ----

export interface HBuilderXConfig {
  /** CLI 可执行文件路径，默认自动检测 */
  path?: string
}

// ---- App Pack ----

export interface AndroidConfig {
  /** 包名 */
  packagename?: string
  /** 打包类型：0=自有证书 1=公共证书 2=老版本 */
  androidpacktype?: '0' | '1' | '2'
  /** 证书别名 */
  certalias?: string
  /** 证书文件路径（.keystore） */
  certfile?: string
  /** 证书密码 */
  certpassword?: string
  /** keystore 密码（HBuilderX 4.41+） */
  storePassword?: string
  /** 渠道包，逗号分隔或数组 */
  channels?: string | string[]
}

export interface IOSCertProfile {
  /** mobileprovision 描述文件路径 */
  profile?: string
  /** p12 证书文件路径 */
  certfile?: string
  /** 证书密码 */
  certpassword?: string
}

export interface IOSConfig {
  /** App ID / Bundle Identifier */
  bundle?: string
  /** 支持的设备类型 */
  supporteddevice?: 'iPhone' | 'iPad' | 'iPhone,iPad'
  /**
   * 开发证书配置（iscustom=true 时使用）
   * 兼容 mimicAI scripts 的 development/distribution 模式
   */
  development?: IOSCertProfile
  /**
   * 发布证书配置（iscustom=false 时使用）
   */
  distribution?: IOSCertProfile
  /** 直接指定 mobileprovision 路径（不使用 development/distribution 时） */
  profile?: string
  /** 直接指定 p12 路径 */
  certfile?: string
  /** 证书密码 */
  certpassword?: string
}

export interface PackConfig {
  /** 打包平台，支持 android、ios 或两者 */
  platform?: 'android' | 'ios' | 'android,ios' | 'ios,android'
  /** 是否打自定义基座 */
  iscustom?: boolean
  /** 安全模式 */
  safemode?: boolean
  /** JS/NVUE 混淆 */
  isconfusion?: boolean
  /** 开屏广告 */
  splashads?: boolean
  /** 浮窗广告 */
  rpads?: boolean
  /** 推送广告 */
  pushads?: boolean
  /** 换量联盟 */
  exchange?: boolean
  android?: AndroidConfig
  ios?: IOSConfig
}

// ---- Publish ----

export interface H5PublishConfig {
  /** 云服务商 */
  provider?: 'aliyun' | 'alipay' | 'tcb'
  /** 云空间 ID */
  spaceId?: string
  /** 网站域名 */
  webDomain?: string
  /** 网站标题 */
  webTitle?: string
  /** 是否上传到 uniCloud 前端网页托管 */
  webHosting?: boolean
  /** SSR 模式 */
  ssr?: boolean
  /** SSR 域名 */
  ssrHost?: string
  /** SSR 云服务商 */
  ssrProvider?: string
}

export interface MpPublishConfig {
  /** 小程序 AppID */
  appid?: string
  /** 上传密钥文件路径 */
  privatekey?: string
  /** 版本号 */
  version?: string
  /** 上传备注 */
  description?: string
  /** 是否自动上传 */
  upload?: boolean
  /** 微信 CI 机器人编号 (1-30) */
  robot?: number
  /** 是否生成 SourceMap */
  sourceMap?: boolean
  /** 分包名称 */
  subPackage?: string
}

export interface PublishConfig {
  h5?: H5PublishConfig
  'mp-weixin'?: MpPublishConfig
  'mp-alipay'?: MpPublishConfig
  [key: string]: unknown
}

// ---- Hooks ----

export interface HooksConfig {
  'before:pack'?: string | string[]
  'after:pack'?: string | string[]
  'before:publish'?: string | string[]
  'after:publish'?: string | string[]
}

// ---- Root ----

export interface UniPackConfig {
  $schema?: string
  hbuilderx?: HBuilderXConfig
  /** uni-app 项目路径（相对于配置文件或绝对路径），默认当前目录 */
  project?: string
  pack?: PackConfig
  publish?: PublishConfig
  hooks?: HooksConfig
}
