import { PluginListenerHandle, registerPlugin } from '@capacitor/core'

export type 应用版本信息 = { versionName: string; versionCode: number }
export type 更新下载进度 = { downloadedBytes: number; totalBytes: number; percent: number }

type 应用更新原生插件 = {
  getCurrentVersion(): Promise<应用版本信息>
  canRequestInstall(): Promise<{ allowed: boolean }>
  openInstallPermissionSettings(): Promise<void>
  downloadAndInstall(选项: { url: string; sha256: string }): Promise<void>
  addListener(事件名: 'downloadProgress', 监听函数: (进度: 更新下载进度) => void): Promise<PluginListenerHandle>
}

export let 应用更新插件 = registerPlugin<应用更新原生插件>('AppUpdater')
