# Android SMB

Android SMB 可以把 Android 设备的内部存储和 SD 卡作为局域网 SMB 共享。电脑无需安装配套客户端，也不需要数据线；在手机上启动服务后，就能像访问普通网络驱动器一样读写文件。

- 项目主页：[https://github.com/lsby/android-smb](https://github.com/lsby/android-smb)
- APK 下载：[GitHub Releases](https://github.com/lsby/android-smb/releases)
- 当前阶段：早期版本，建议先在非关键数据上使用

## 为什么需要 Android SMB

文件虽然存放在手机里，但手机本身并不适合复杂的文件管理。面对大量目录时，小屏幕和触控操作很难高效完成批量选择、跨目录移动、重命名、归档和清理；不同应用内置的文件入口又彼此割裂，路径难找、能力受限，操作经常做到一半就卡住。

传统替代方案也不够顺手：

- **USB 数据线**：每次传输都要找线、插线、切换连接模式，还可能遇到接口、驱动或线材问题。
- **应用内传输工具**：通常只能处理应用自己的文件，复杂目录操作和跨应用整理仍然困难。
- **WebDAV**：适合基础上传和下载，但在部分客户端中，批量移动、重命名、深层目录管理以及长时间传输的体验不如原生文件共享。

Android SMB 的思路很直接：**手机只负责提供存储，复杂管理交给电脑。** 启动服务后，直接使用 Windows 文件资源管理器等熟悉的桌面工具整理手机文件，不必先把整个目录复制到电脑，也不必再适应一套功能受限的手机端界面。

## 核心特性

- **默认无需 Root**：普通模式使用 `1024–65535` 端口，默认监听 `4450`，不会修改 iptables、sysctl 或系统 SMB 配置。
- **Root 完全可选**：只有主动勾选 Root 模式并点击启动时才会请求授权，可监听标准 `445` 端口。
- **多个共享目录**：内部存储根目录和检测到的可移除 SD 卡可同时作为独立共享。
- **明确的读写边界**：内部存储与 SD 卡可读写；Root 模式提供的 `system` 系统根共享固定只读。
- **前台服务守护**：SMB 服务由 Android 前台服务管理；控制进程消失或通信管道断开时，子进程会退出并释放端口。
- **应用内生成连接命令**：服务器启动后会显示当前 IP、端口和可直接复制的 Windows 命令。

## 兼容性

| 项目             | 当前支持情况                               |
| ---------------- | ------------------------------------------ |
| Android          | Android 6.0（API 23）或更新版本            |
| CPU 架构         | ARM64；当前 APK 未包含其他 ABI             |
| SMB 协议         | SMB2/3                                     |
| Windows 标准端口 | 使用 `445` 时按普通 SMB 路径连接           |
| Windows 替代端口 | `/TCPPORT` 需要 Windows 11 24H2 或更新版本 |

手机和客户端设备必须处于可互相访问的局域网。访客网络隔离、系统防火墙或路由器的 AP 隔离功能可能会阻止连接。

## 运行模式

| 能力            | 普通模式     | Root 模式 |
| --------------- | ------------ | --------- |
| 是否需要 Root   | 否           | 是        |
| 端口范围        | `1024–65535` | `1–65535` |
| 默认端口        | `4450`       | `445`     |
| 内部存储        | 读写         | 读写      |
| 可移除 SD 卡    | 读写         | 读写      |
| `system` 系统根 | 不可用       | 只读      |

日常使用推荐普通模式。只有客户端不支持替代端口，或确实需要读取系统根目录时，再考虑 Root 模式。

## 快速开始

1. 从 [GitHub Releases](https://github.com/lsby/android-smb/releases) 下载 APK 并安装。
2. 打开应用，按提示授予通知权限和“所有文件访问权限”。
3. 推荐给手机配置固定 IP，方便长期使用。
4. 设置端口、用户名和密码，选择至少一个共享目录。
5. 保持普通模式，或按需启用 Root 模式，然后点击“启动服务器”。
6. 让电脑与手机连接到同一个局域网，复制应用显示的持久映射命令并在 Windows PowerShell 或 Windows Terminal 中运行。

请将默认密码修改为强密码。不要在公共 Wi-Fi 或不受信任的局域网中开放共享。

## 推荐用法：固定 IP 与持久映射

Android SMB 最适合被设置成一个随用随开的手机文件入口，而不是每次临时传输都重新连接：

1. 给手机配置 **固定 IP**，确保每次接入局域网时使用同一个地址。
2. 在 Android SMB 中保持相同的端口、用户名、共享名称和密码。
3. 第一次启动服务后，在 Windows 中运行应用生成的命令。命令中的 `/persistent:yes` 会让 Windows 保留网络驱动器映射。
4. 以后需要管理手机文件时，只需打开 Android SMB 并启动服务，原来的盘符就会重新可用，可以直接用文件资源管理器整理和传输文件。

如果手机的 IP、端口或共享名称发生变化，Windows 保存的映射仍会指向旧地址，需要删除后重新建立。

## Windows 连接

### 普通模式

普通模式默认使用 `4450` 端口，需要 Windows 11 24H2 或更新版本：

```powershell
net use * \\192.168.8.150\internal /TCPPORT:4450 /user:android-smb * /persistent:yes
```

### Root 模式

Root 模式监听标准 `445` 端口时，可以使用普通 SMB 路径：

```powershell
net use * \\192.168.8.150\internal /user:android-smb * /persistent:yes
```

示例中的 IP、端口、用户名和共享名请替换为应用实际显示的值。第一个 `*` 会让 Windows 自动选择空闲盘符，用户名后面的 `*` 会安全提示输入密码，避免把密码留在命令历史中；`/persistent:yes` 会保留这次映射。若希望指定盘符，可以把第一个 `*` 改成 `Z:` 等尚未占用的盘符。

断开网络驱动器时可运行：

```powershell
net use Z: /delete
```

其中 `Z:` 请替换为 Windows 实际分配的盘符。

## 共享目录

| 共享名        | 内容                     | 权限 | 额外要求         |
| ------------- | ------------------------ | ---- | ---------------- |
| `internal`    | Android 内部存储根目录   | 读写 | 所有文件访问权限 |
| SD 卡动态名称 | 检测到的可移除存储根目录 | 读写 | 所有文件访问权限 |
| `system`      | Android 系统根目录 `/`   | 只读 | Root 模式        |

可移除存储只会在系统能够检测到时显示。实际路径和共享名称以应用界面为准。

## 权限与安全说明

- “所有文件访问权限”用于访问用户选择共享的内部存储和 SD 卡。
- 通知权限用于显示 Android 前台服务的持续通知。
- Root 权限不会在应用启动时申请，只会在用户启用 Root 模式并启动服务器时申请。
- `system` 共享固定只读，避免通过 SMB 修改系统根目录。
- SMB 服务面向当前局域网监听。请使用独立强密码，并在使用结束后停止服务器。
- 账号信息当前保存在设备本地的 WebView 存储中，请不要复用重要账号密码。

## 项目结构

```text
android/                         Android 工程、原生插件与前台服务
native/smb-server/               Android SMB 启动器的 Rust 源码
native/vendor/smb-server/        固定并带本地补丁的 smb-server 0.4.0
src/web/components/project/      应用界面与网站落地页
src/web/global/native/           Capacitor 原生插件类型定义
scripts/public/                  构建和发布脚本
```

主要运行链路如下：

```text
Web Components 界面
        ↓ Capacitor 插件
Android 原生服务
        ↓ stdin/stdout 配置与状态
Rust SMB 子进程
        ↓
内部存储 / SD 卡 / 只读系统根
```

项目在 `native/vendor/smb-server` 固定了一份 `smb-server 0.4.0` 本地补丁版本，用于报告真实磁盘容量并处理并发 SMB 请求。更新上游依赖时需要重新核对这些补丁。

## 开发与构建

需要准备 Node.js、pnpm、JDK 和 Android SDK。仓库已包含当前 ARM64 SMB 原生库；只修改 TypeScript、Web 或 Android 层时可直接执行下面的流程。

```powershell
pnpm install
pnpm exec dotenv -e ./.env/.env.development.pure-frontend -- pnpm _build:web:pure-frontend
pnpm capacitor:sync:android
./android/gradlew.bat -p android :app:assembleDebug
```

Debug APK 输出位置：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

仅开发网页落地页时可以运行：

```powershell
pnpm run run:pure-frontend:dev
```

## 发布落地页到阿里云 OSS

发布脚本会先按 OSS 子目录重新构建纯前端页面，再比较本地文件 MD5 与云端 ETag。它只上传有变化的文件，并删除目标子目录中本次构建已不存在的文件；HTML 和 Service Worker 使用 `no-cache`，带哈希的静态资源使用长期缓存。

1. 复制配置模板：

   ```powershell
   Copy-Item scripts/public/release-oss-aliyun-config.example.json scripts/public/release-oss-aliyun-config.json
   ```

2. 填写 `region`、`accessKeyId`、`accessKeySecret`、`bucket` 和 `云端目标目录`。真实配置已加入 `.gitignore`，不要提交凭据。
3. 先做一次不连接 OSS 的子目录构建检查：

   ```powershell
   pnpm public:oss:aliyun -- --build-only=/android-smb/
   ```

4. 预览变更并确认发布：

   ```powershell
   pnpm public:oss:aliyun
   ```

自动化环境可追加 `--yes` 跳过确认。为避免误删整个 Bucket，脚本禁止把 Bucket 根目录作为同步目标；请始终给项目配置独立子目录。

## 上游项目

SMB 核心基于 [`paltaio/rust-smb-server`](https://github.com/paltaio/rust-smb-server)，仓库内固定的上游源码及其许可证位于 `native/vendor/smb-server`。
