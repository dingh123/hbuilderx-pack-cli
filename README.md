# hbuilderx-pack-cli

标准化的 HBuilderX CLI 打包工具，支持 App 打包（Android / iOS）、小程序发布、H5 部署，适用于任何 uni-app 项目，开箱即用，CI/CD 友好。

[![npm version](https://img.shields.io/npm/v/hbuilderx-pack-cli)](https://www.npmjs.com/package/hbuilderx-pack-cli)
[![license](https://img.shields.io/npm/l/hbuilderx-pack-cli)](./LICENSE)
[![node](https://img.shields.io/node/v/hbuilderx-pack-cli)](https://nodejs.org)

> 本工具是对 HBuilderX 官方 CLI 的封装。官方文档（参数语义、平台枚举等原始定义）：
> [https://hx.dcloud.net.cn/cli/README](https://hx.dcloud.net.cn/cli/README)

## 安装

```bash
npm install -g hbuilderx-pack-cli
# 或在项目中本地安装
npm install -D hbuilderx-pack-cli
```

## 快速开始

**第一步：在 uni-app 项目根目录初始化配置文件**

```bash
hbx-pack init
```

按提示填写包名、Bundle ID 等信息，生成 `uni-pack.config.json`，然后补充证书路径。

**第二步：检查环境**

```bash
hbx-pack doctor
```

自动检测 HBuilderX 安装路径、登录状态、证书文件是否存在，有问题会给出修复建议。

**第三步：打包**

```bash
# 正式打包（发布上架）
hbx-pack pack --platform android   # 仅 Android
hbx-pack pack --platform ios       # 仅 iOS
hbx-pack pack                      # Android + iOS 同时打

# 自定义基座（用于真机调试，集成原生插件时必须）
hbx-pack pack --platform android --iscustom
hbx-pack pack --platform ios --iscustom
```

## 命令

| 命令 | 说明 |
|---|---|
| `hbx-pack init` | 初始化配置文件 |
| `hbx-pack doctor` | 检查 HBuilderX 环境、登录状态、证书文件 |
| `hbx-pack pack` | App 云打包（Android / iOS） |
| `hbx-pack publish` | 发布（H5 / 小程序 / App 资源包） |
| `hbx-pack launch` | 在设备上运行调试 |
| `hbx-pack devices` | 列出已连接设备 |
| `hbx-pack user` | DCloud 账号管理 |
| `hbx-pack cloud` | UniCloud 云函数操作 |

## 配置文件

在项目根目录创建 `uni-pack.config.json`（支持 `$schema` 字段以获得 IDE 补全）：

```json
{
  "$schema": "https://unpkg.com/hbuilderx-pack-cli/schema/uni-pack.schema.json",
  "project": "./",
  "pack": {
    "safemode": true,
    "android": {
      "packagename": "com.example.app",
      "certalias": "your-alias",
      "certfile": "./certs/android.keystore",
      "certpassword": "${ANDROID_CERT_PASSWORD}",
      "storePassword": "${ANDROID_STORE_PASSWORD}"
    },
    "ios": {
      "bundle": "com.example.app",
      "supporteddevice": "iPhone",
      "development": {
        "profile": "./certs/dev.mobileprovision",
        "certfile": "./certs/dev.p12",
        "certpassword": "${IOS_DEV_CERT_PASSWORD}"
      },
      "distribution": {
        "profile": "./certs/dis.mobileprovision",
        "certfile": "./certs/dis.p12",
        "certpassword": "${IOS_DIS_CERT_PASSWORD}"
      }
    }
  },
  "publish": {
    "mp-weixin": {
      "appid": "wx...",
      "privatekey": "./certs/weixin.key",
      "upload": true
    }
  },
  "hooks": {
    "before:pack": "npm run test",
    "after:pack": "node ./scripts/notify.js"
  }
}
```

### 环境变量替换

配置中的 `${VAR_NAME}` 会自动从环境变量读取，适合 CI/CD 场景：

```bash
ANDROID_CERT_PASSWORD=xxx hbx-pack pack --platform android
```

### HBuilderX CLI 路径

hbuilderx-pack-cli 自动检测 HBuilderX CLI，也可手动指定：

| 方式 | 说明 |
|---|---|
| 配置文件 `hbuilderx.path` | 优先级最高 |
| 环境变量 `HBUILDERX_CLI` | 适合 CI/CD |
| 系统默认路径 | macOS: `/Applications/HBuilderX.app/Contents/MacOS/cli` |

## pack 命令

打包走 HBuilderX 云端服务，需要登录 DCloud 账号并有云打包配额。

```
hbx-pack pack [options]

Options:
  -p, --platform <platform>  打包平台: android | ios | all（默认 all）
  --iscustom                 打自定义基座（不加此参数则为正式打包）
  --no-safemode              禁用安全模式
  --config <path>            指定配置文件（默认查找 uni-pack.config.json）
  --cwd <path>               工作目录（默认当前目录）
```

### 两种打包模式

#### 正式打包（发布上架用）

不加 `--iscustom` 时默认就是正式打包，产物是可以发布到应用市场的 `.apk` / `.ipa`。

```bash
hbx-pack pack                        # Android + iOS 同时打包
hbx-pack pack --platform android     # 仅打 Android
hbx-pack pack --platform ios         # 仅打 iOS
```

iOS 正式打包自动使用 `ios.distribution` 证书（App Store 发布证书）。

#### 自定义基座（开发调试用）

加 `--iscustom` 打出的是**自定义基座**，用于在 HBuilderX 中替代官方基座进行真机调试，集成了原生插件后必须用自定义基座才能调试。

```bash
hbx-pack pack --iscustom                       # Android + iOS 自定义基座
hbx-pack pack --platform android --iscustom    # 仅 Android 自定义基座
hbx-pack pack --platform ios --iscustom        # 仅 iOS 自定义基座
```

iOS 自定义基座自动使用 `ios.development` 证书（开发证书）。

### iOS 证书自动切换

在配置文件中分别配置开发和发布两套证书，打包时自动选择，无需手动切换：

```json
{
  "pack": {
    "ios": {
      "bundle": "com.example.app",
      "development": {
        "profile":      "./certs/dev.mobileprovision",
        "certfile":     "./certs/dev.p12",
        "certpassword": "${IOS_DEV_CERT_PASSWORD}"
      },
      "distribution": {
        "profile":      "./certs/dis.mobileprovision",
        "certfile":     "./certs/dis.p12",
        "certpassword": "${IOS_DIS_CERT_PASSWORD}"
      }
    }
  }
}
```

| 命令 | iOS 使用的证书 |
|---|---|
| `hbx-pack pack --platform ios` | `distribution`（发布证书）|
| `hbx-pack pack --platform ios --iscustom` | `development`（开发证书）|

> 如果不需要区分，也可以直接在 `ios` 下写 `profile` / `certfile` / `certpassword`，两种模式共用同一套证书。

### Android 渠道包

在配置文件中设置 `channels` 字段，一次打出多个渠道包：

```json
{
  "pack": {
    "android": {
      "channels": ["huawei", "xiaomi", "oppo", "vivo", "yyb"]
    }
  }
}
```

支持的渠道：`google` `yyb` `360` `huawei` `xiaomi` `oppo` `vivo` `baidu` `wandoujia` `lenovo` `honor` `downsite`

### 多套配置文件

同一个项目维护多套打包配置（如测试环境 / 正式环境证书不同）：

```bash
hbx-pack pack --config uni-pack.staging.json
hbx-pack pack --config uni-pack.prod.json
```

## publish 命令

```bash
# 发布微信小程序
hbx-pack publish -p mp-weixin

# 发布 H5 到 uniCloud
hbx-pack publish -p h5

# CLI 参数覆盖配置
hbx-pack publish -p mp-weixin --version 1.2.0 --description "修复若干问题"
```

## launch 命令

在连接的设备或模拟器上直接运行 uni-app 项目，相当于 HBuilderX 的"运行到手机或模拟器"。

```
hbx-pack launch [options]

Options:
  -p, --platform <platform>  目标平台: app-android | app-ios | app-harmony（必填）
  --device-id <id>           设备序列号；不传时自动检测
  --ios-target <target>      iOS 目标: device | simulator
  --playground <type>        基座类型: standard | custom
  --native-log               显示原生日志
  --clean-cache              清除缓存
  --compile-only             仅编译不运行
  --page-path <path>         启动页面路径
  --page-query <query>       启动页面参数
  --config <path>            指定配置文件
  --cwd <path>               工作目录（默认当前目录）
```

### 自动设备检测

未传 `--device-id` 时会根据 `--platform`（以及 `--ios-target`）自动调 `cli devices list` 拉取对应平台的设备：

- **0 台**：跳过，交给 HBuilderX 处理
- **1 台**：自动选中该设备
- **多台**：进入交互菜单选择

```bash
$ hbx-pack launch -p app-android --playground custom

请选择设备：
❯ 1) HONOR BVL-AN00  (AP7GVB3C30007421)
  2) Medium_Phone_API_35  (emulator-5554)
  ↑/↓ 选择 · Enter 确认 · 数字快选 · Ctrl+C 取消
```

交互操作：

- `↑ / ↓` 上下移动选择
- `Enter` 确认当前项
- 数字键 `1`-`9` 直接跳选并确认
- `Ctrl+C` 取消（退出码 130）

非 TTY 环境（CI、pipe）自动降级为"输入编号"模式。

### 平台映射

`--platform` 和 `--ios-target` 组合决定查询哪类设备：

| 命令组合 | 查询的 HBuilderX 平台 |
|---|---|
| `-p app-android` | `android`（真机 + 安卓模拟器） |
| `-p app-ios`（或 `--ios-target device`） | `ios-iPhone` |
| `-p app-ios --ios-target simulator` | `ios-simulator` |
| `-p app-harmony` | `app-harmony` |

### 在业务项目里用作 npm script

```json
{
  "scripts": {
    "dev:android": "hbx-pack launch -p app-android --playground custom",
    "dev:ios":     "hbx-pack launch -p app-ios --ios-target device --playground custom",
    "dev:ios-sim": "hbx-pack launch -p app-ios --ios-target simulator"
  }
}
```

## devices 命令

列出已连接的设备，默认查安卓。

```
hbx-pack devices [options]

Options:
  -p, --platform <platform>  目标平台: android | ios-iPhone | ios-simulator | mp-harmony | app-harmony（默认 android）
  --config <path>            指定配置文件
  --cwd <path>               工作目录
```

```bash
hbx-pack devices                      # 安卓设备 + 模拟器
hbx-pack devices -p ios-iPhone        # iOS 真机
hbx-pack devices -p ios-simulator     # iOS 模拟器
hbx-pack devices -p app-harmony       # 鸿蒙 App
hbx-pack devices -p mp-harmony        # 鸿蒙元服务
```

输出格式：`时间戳 设备名【设备ID】`，其中"设备ID"就是 `launch --device-id` 需要的值。

## user 命令

```bash
hbx-pack user info              # 查看登录状态
hbx-pack user login -u <email> -p <password>
hbx-pack user logout
```

## cloud 命令

```bash
hbx-pack cloud list --provider aliyun
hbx-pack cloud upload --type all --provider aliyun
hbx-pack cloud download --type cloudfunction --name myFunc --provider aliyun
```

## 构建钩子

在 `uni-pack.config.json` 的 `hooks` 字段中配置，在打包/发布前后自动执行：

```json
{
  "hooks": {
    "before:pack":    "npm run test",
    "after:pack":     ["node ./scripts/upload-to-oss.js", "node ./scripts/notify.js"],
    "before:publish": "npm run build",
    "after:publish":  "echo 发布完成"
  }
}
```

## 作为库使用

```typescript
import { loadConfig, packWithConfig, getCliPath, validateEnvironment } from 'hbuilderx-pack-cli'

const { config, configDir } = loadConfig(process.cwd())
const { cliPath } = validateEnvironment(config)

// 自定义打包逻辑
packWithConfig(cliPath, '/path/to/config.json')
```

## 多配置文件

同一项目维护多套环境：

```bash
hbx-pack pack --config uni-pack.prod.json
hbx-pack pack --config uni-pack.staging.json
```

## 支持的配置文件名

- `uni-pack.config.json`（推荐）
- `.unipackrc`
- `.unipackrc.json`

## 环境要求

- Node.js >= 18
- HBuilderX（已安装并登录 DCloud 账号）

## 参考

- HBuilderX CLI 官方文档：[https://hx.dcloud.net.cn/cli/README](https://hx.dcloud.net.cn/cli/README) —— 本工具所有透传参数（`--platform`、`--deviceId`、`--playground` 等）的语义以此为准

## License

MIT
