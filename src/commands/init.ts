import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { log } from '../core/logger.js'

const TEMPLATE: Record<string, unknown> = {
  $schema: 'https://unpkg.com/uni-pack-cli/schema/uni-pack.schema.json',
  hbuilderx: {
    path: '',
  },
  project: './',
  pack: {
    safemode: true,
    android: {
      packagename: 'com.example.app',
      androidpacktype: '0',
      certalias: 'your-alias',
      certfile: './certs/android.keystore',
      certpassword: '${ANDROID_CERT_PASSWORD}',
      storePassword: '${ANDROID_STORE_PASSWORD}',
    },
    ios: {
      bundle: 'com.example.app',
      supporteddevice: 'iPhone',
      development: {
        profile: './certs/dev.mobileprovision',
        certfile: './certs/dev.p12',
        certpassword: '${IOS_DEV_CERT_PASSWORD}',
      },
      distribution: {
        profile: './certs/dis.mobileprovision',
        certfile: './certs/dis.p12',
        certpassword: '${IOS_DIS_CERT_PASSWORD}',
      },
    },
  },
  publish: {
    h5: {
      provider: 'aliyun',
      spaceId: '',
      webHosting: true,
    },
    'mp-weixin': {
      appid: '',
      privatekey: './certs/weixin.key',
      upload: true,
    },
  },
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve))
}

export function createInitCommand(): Command {
  return new Command('init')
    .description('在当前目录初始化 uni-pack.config.json 配置文件')
    .option('--force', '覆盖已有配置文件')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action(async (opts: { force?: boolean; cwd?: string }) => {
      const cwd = opts.cwd ?? process.cwd()
      const configPath = path.join(cwd, 'uni-pack.config.json')

      if (fs.existsSync(configPath) && !opts.force) {
        log.warn(`配置文件已存在: ${configPath}`)
        log.dim('  使用 --force 覆盖')
        process.exit(1)
      }

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

      console.log('')
      log.info('初始化 uni-pack 配置文件')
      console.log('')

      const packagename = await prompt(rl, '  App 包名 (如 com.example.app): ')
      const bundle      = await prompt(rl, '  iOS Bundle ID (如 com.example.app): ')
      const hxPath      = await prompt(rl, '  HBuilderX CLI 路径 (留空使用默认): ')

      rl.close()

      // 填充用户输入
      const config = JSON.parse(JSON.stringify(TEMPLATE))

      if (packagename) config.pack.android.packagename = packagename.trim()
      if (bundle)      config.pack.ios.bundle = bundle.trim()
      if (hxPath)      config.hbuilderx.path  = hxPath.trim()
      else             delete config.hbuilderx.path

      if (!config.hbuilderx.path) delete config.hbuilderx

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      console.log('')
      log.success(`配置文件已创建: ${configPath}`)
      log.dim('')
      log.dim('  下一步:')
      log.dim('  1. 编辑 uni-pack.config.json，填写证书路径等信息')
      log.dim('  2. 运行 uni-pack doctor 检查环境')
      log.dim('  3. 运行 uni-pack pack --platform android 开始打包')
    })
}
