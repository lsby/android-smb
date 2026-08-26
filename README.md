# Android SMB

把 Android 设备的存储空间作为局域网 SMB 共享。

当前原型支持：

- 非 Root 模式：可自定义 `1024–65535` 端口，默认为 `4450`，不修改 iptables、sysctl 或系统 SMB 配置。
- Root 模式：由用户手动选择，只有点击启动时才请求 Root 授权；可使用 `1–65535` 端口。
- `internal`：内部存储根目录，可读写。
- 可移除 SD 卡根目录：检测到时显示，可读写。
- `system`：系统根目录，固定只读且需要 Root。
- 通过 Android 前台服务管理 SMB 子进程。控制进程消失或管道断开时，SMB 进程会退出并释放端口。

## Windows 连接

非 Root 模式需要支持 SMB 替代 TCP 端口的 Windows 11 24H2 或更新版本：

```powershell
net use * \\192.168.8.150\internal /TCPPORT:4450 /user:android-smb *
```

Root 模式使用标准 SMB 路径：

```powershell
net use * \\192.168.8.150\internal /user:android-smb *
```

IP、端口、用户名和共享名称以应用界面显示为准。第一个 `*` 让 Windows 自动选择空闲盘符，最后一个 `*` 会安全提示输入密码。

## 开发构建

当前 APK 内置的 SMB 核心仅包含 ARM64 Android 版本。Rust 源码位于 `native/smb-server`，Android 工程位于 `android`。

```powershell
pnpm install
pnpm exec dotenv -e ./.env/.env.development.pure-frontend -- pnpm _build:web:pure-frontend
pnpm capacitor:sync:android
./android/gradlew.bat -p android :app:assembleDebug
```

Android debug APK 生成于 `android/app/build/outputs/apk/debug/app-debug.apk`。
