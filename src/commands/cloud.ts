import { Command } from 'commander'
import { log } from '../core/logger.js'
import { cloudFunctions } from '../core/hbuilderx.js'
import { loadConfig, resolveProject } from '../core/config.js'
import { validateEnvironment } from '../core/validator.js'

type CloudProvider = 'aliyun' | 'tcb'
type ListType = 'cloudfunction' | 'common' | 'db' | 'vf' | 'action' | 'space'
type UploadType = 'all' | 'cloudfunction' | 'common' | 'db' | 'vf' | 'action'

export function createCloudCommand(): Command {
  const cloud = new Command('cloud').description('UniCloud 云函数操作')

  // cloud functions list
  cloud
    .command('list')
    .description('列出云函数列表')
    .option('--type <type>', '类型: cloudfunction | common | db | vf | action | space', 'cloudfunction')
    .option('--provider <provider>', '云服务商: aliyun | tcb', 'aliyun')
    .option('--cloud', '从云端获取（默认从本地）')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { type: string; provider: string; cloud?: boolean; config?: string; cwd?: string }) => {
      const cwd = opts.cwd ?? process.cwd()

      let loadResult: ReturnType<typeof loadConfig>
      try {
        loadResult = loadConfig(cwd, opts.config)
      } catch (err) {
        log.error((err as Error).message)
        process.exit(1)
      }

      const { config, configDir } = loadResult
      const { cliPath } = validateEnvironment(config)
      const project = resolveProject(config, configDir)

      const args = [
        '--list', opts.type as ListType,
        '--prj', project,
        '--provider', opts.provider as CloudProvider,
      ]
      if (opts.cloud) args.push('--cloud')

      try {
        const result = cloudFunctions(cliPath, args)
        console.log(result)
      } catch (err) {
        log.error(`获取列表失败: ${(err as Error).message}`)
        process.exit(1)
      }
    })

  // cloud functions upload
  cloud
    .command('upload')
    .description('上传云函数')
    .option('--type <type>', '类型: all | cloudfunction | common | db | vf | action', 'all')
    .option('--name <name>', '函数名称')
    .option('--provider <provider>', '云服务商: aliyun | tcb', 'aliyun')
    .option('--force', '强制覆盖')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { type: string; name?: string; provider: string; force?: boolean; config?: string; cwd?: string }) => {
      const cwd = opts.cwd ?? process.cwd()

      let loadResult: ReturnType<typeof loadConfig>
      try {
        loadResult = loadConfig(cwd, opts.config)
      } catch (err) {
        log.error((err as Error).message)
        process.exit(1)
      }

      const { config, configDir } = loadResult
      const { cliPath } = validateEnvironment(config)
      const project = resolveProject(config, configDir)

      const args = [
        '--upload', opts.type as UploadType,
        '--prj', project,
        '--provider', opts.provider as CloudProvider,
      ]
      if (opts.name) args.push('--name', opts.name)
      if (opts.force) args.push('--force')

      log.meta({ '项目': project, '类型': opts.type, '服务商': opts.provider })
      log.divider('上传云函数')

      try {
        const result = cloudFunctions(cliPath, args)
        if (result) console.log(result)
        log.success('上传完成')
      } catch (err) {
        log.error(`上传失败: ${(err as Error).message}`)
        process.exit(1)
      }
    })

  // cloud functions download
  cloud
    .command('download')
    .description('下载云函数')
    .option('--type <type>', '类型: all | cloudfunction | common | db | vf | action', 'all')
    .option('--name <name>', '函数名称')
    .option('--provider <provider>', '云服务商: aliyun | tcb', 'aliyun')
    .option('--force', '强制覆盖')
    .option('--config <path>', '指定配置文件路径')
    .option('--cwd <path>', '工作目录（默认：当前目录）')
    .action((opts: { type: string; name?: string; provider: string; force?: boolean; config?: string; cwd?: string }) => {
      const cwd = opts.cwd ?? process.cwd()

      let loadResult: ReturnType<typeof loadConfig>
      try {
        loadResult = loadConfig(cwd, opts.config)
      } catch (err) {
        log.error((err as Error).message)
        process.exit(1)
      }

      const { config, configDir } = loadResult
      const { cliPath } = validateEnvironment(config)
      const project = resolveProject(config, configDir)

      const args = [
        '--download', opts.type as UploadType,
        '--prj', project,
        '--provider', opts.provider as CloudProvider,
      ]
      if (opts.name) args.push('--name', opts.name)
      if (opts.force) args.push('--force')

      log.meta({ '项目': project, '类型': opts.type, '服务商': opts.provider })

      try {
        const result = cloudFunctions(cliPath, args)
        if (result) console.log(result)
        log.success('下载完成')
      } catch (err) {
        log.error(`下载失败: ${(err as Error).message}`)
        process.exit(1)
      }
    })

  return cloud
}
