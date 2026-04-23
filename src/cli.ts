import { Command } from 'commander'

declare const __VERSION__: string
import { createPackCommand }    from './commands/pack.js'
import { createPublishCommand } from './commands/publish.js'
import { createLaunchCommand }  from './commands/launch.js'
import { createUserCommand }    from './commands/user.js'
import { createDevicesCommand } from './commands/devices.js'
import { createCloudCommand }   from './commands/cloud.js'
import { createDoctorCommand }  from './commands/doctor.js'
import { createInitCommand }    from './commands/init.js'

const program = new Command()

program
  .name('hbx-pack')
  .description('标准化的 HBuilderX CLI 打包工具，支持 App 打包、小程序发布、H5 部署')
  .version(__VERSION__)

program.addCommand(createInitCommand())
program.addCommand(createDoctorCommand())
program.addCommand(createUserCommand())
program.addCommand(createPackCommand())
program.addCommand(createPublishCommand())
program.addCommand(createLaunchCommand())
program.addCommand(createDevicesCommand())
program.addCommand(createCloudCommand())

program.parse()
