import { Capacitor, PluginListenerHandle } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { z } from 'zod'
import { 组件基类 } from '../../../base/base'
import { 应用更新插件, 更新下载进度 } from '../../../global/native/app-updater'
import { 普通按钮 } from '../../general/base/base-button'

type 发出事件类型 = {}
type 监听事件类型 = {}
type 可比较版本 = { 主版本: number; 次版本: number; 修订版本: number; 预发布: string | null }

let GitHub资产结构 = z.object({
  name: z.string(),
  browser_download_url: z.string().url(),
  size: z.number().int().nonnegative(),
  digest: z.string().nullable().optional(),
})
let GitHub发布结构 = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  body: z.string().nullable(),
  html_url: z.string().url(),
  assets: z.array(GitHub资产结构),
})
type GitHub发布 = z.infer<typeof GitHub发布结构>
type GitHub资产 = z.infer<typeof GitHub资产结构>

export class 应用更新组件 extends 组件基类<发出事件类型, 监听事件类型> {
  static {
    this.注册组件('android-smb-app-updater', this)
  }

  private 检查按钮 = new 普通按钮({ 文本: '检查更新', 点击处理函数: async (): Promise<void> => await this.检查更新() })
  private 下载监听器: PluginListenerHandle | undefined
  private 正在检查 = false

  protected override async 当加载时(): Promise<void> {
    this.获得宿主样式().display = 'inline-block'
    this.shadow.append(this.检查按钮)
    if (Capacitor.isNativePlatform() === false) {
      this.检查按钮.设置禁用(true)
      return
    }
    this.下载监听器 = await 应用更新插件.addListener('downloadProgress', (进度: 更新下载进度): void => {
      this.显示下载进度(进度)
    })
  }

  protected override async 当卸载时(): Promise<void> {
    if (this.下载监听器 !== undefined) {
      await this.下载监听器.remove()
      this.下载监听器 = undefined
    }
  }

  private async 检查更新(): Promise<void> {
    if (this.正在检查 === true) {
      return
    }
    this.正在检查 = true
    this.检查按钮.设置禁用(true)
    this.检查按钮.设置文本('正在检查…')
    try {
      let 当前版本 = await 应用更新插件.getCurrentVersion()
      let 最新发布 = await this.获得最新发布()
      let 最新资产 =
        最新发布.assets.find((资产: GitHub资产): boolean => 资产.name.endsWith('-arm64-v8a.apk')) ??
        最新发布.assets.find((资产: GitHub资产): boolean => 资产.name.endsWith('.apk'))
      if (最新资产 === undefined) {
        throw new Error('最新 GitHub Release 中没有可用的 APK')
      }
      if (this.比较版本(最新发布.tag_name, 当前版本.versionName) <= 0) {
        await Dialog.alert({
          title: '已是最新版本',
          message: `当前版本：${当前版本.versionName}`,
          buttonTitle: '知道了',
        })
        return
      }
      let 更新说明 = 最新发布.body?.trim()
      let 确认结果 = await Dialog.confirm({
        title: `发现新版本 ${最新发布.tag_name}`,
        message: `${更新说明 === undefined || 更新说明 === '' ? '此版本未提供更新说明。' : 更新说明.slice(0, 1600)}\n\nAPK 大小：${this.格式化大小(最新资产.size)}`,
        okButtonTitle: '下载更新',
        cancelButtonTitle: '稍后再说',
      })
      if (确认结果.value === true) {
        await this.下载并安装(最新资产)
      }
    } catch (错误: unknown) {
      let 消息 = 错误 instanceof Error ? 错误.message : String(错误)
      await Dialog.alert({ title: '检查更新失败', message: 消息, buttonTitle: '知道了' })
    } finally {
      this.正在检查 = false
      this.检查按钮.设置文本('检查更新')
      this.检查按钮.设置禁用(false)
    }
  }

  private async 获得最新发布(): Promise<GitHub发布> {
    let 响应 = await fetch('https://api.github.com/repos/lsby/android-smb/releases/latest', {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    })
    if (响应.ok === false) {
      throw new Error(`GitHub 请求失败，HTTP ${响应.status}`)
    }
    return GitHub发布结构.parse(await 响应.json())
  }

  private async 下载并安装(资产: GitHub资产): Promise<void> {
    let { allowed } = await 应用更新插件.canRequestInstall()
    if (allowed === false) {
      let 确认结果 = await Dialog.confirm({
        title: '需要安装权限',
        message: '请在系统设置中允许 Android SMB 安装未知应用，返回后再次点击“检查更新”即可继续。',
        okButtonTitle: '打开设置',
        cancelButtonTitle: '取消',
      })
      if (确认结果.value === true) {
        await 应用更新插件.openInstallPermissionSettings()
      }
      return
    }
    let 摘要 = 资产.digest?.startsWith('sha256:') === true ? 资产.digest.slice('sha256:'.length) : ''
    this.检查按钮.设置文本('准备下载…')
    try {
      await 应用更新插件.downloadAndInstall({ url: 资产.browser_download_url, sha256: 摘要 })
    } catch (错误: unknown) {
      let 消息 = 错误 instanceof Error ? 错误.message : String(错误)
      await Dialog.alert({ title: '下载更新失败', message: 消息, buttonTitle: '知道了' })
    }
  }

  private 显示下载进度(进度: 更新下载进度): void {
    if (进度.percent >= 0) {
      this.检查按钮.设置文本(`下载 ${进度.percent}%`)
    } else {
      this.检查按钮.设置文本(`已下载 ${this.格式化大小(进度.downloadedBytes)}`)
    }
  }

  private 格式化大小(字节数: number): string {
    if (字节数 < 1024 * 1024) {
      return `${Math.max(0, 字节数 / 1024).toFixed(1)} KB`
    }
    return `${Math.max(0, 字节数 / 1024 / 1024).toFixed(1)} MB`
  }

  private 比较版本(左版本: string, 右版本: string): number {
    let 左 = this.解析版本(左版本)
    let 右 = this.解析版本(右版本)
    if (左 === null || 右 === null) {
      throw new Error(`无法比较版本号：${左版本} / ${右版本}`)
    }
    let 左数字 = [左.主版本, 左.次版本, 左.修订版本]
    let 右数字 = [右.主版本, 右.次版本, 右.修订版本]
    for (let 索引 = 0; 索引 < 左数字.length; 索引 += 1) {
      let 左值 = 左数字[索引]
      let 右值 = 右数字[索引]
      if (左值 === undefined || 右值 === undefined) {
        throw new Error('版本号结构无效')
      }
      if (左值 !== 右值) {
        return 左值 > 右值 ? 1 : -1
      }
    }
    if (左.预发布 === 右.预发布) {
      return 0
    }
    if (左.预发布 === null) {
      return 1
    }
    if (右.预发布 === null) {
      return -1
    }
    return 左.预发布.localeCompare(右.预发布, undefined, { numeric: true })
  }

  private 解析版本(版本: string): 可比较版本 | null {
    let 匹配 = /^v?(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/.exec(版本.trim())
    if (匹配 === null) {
      return null
    }
    let 主版本 = 匹配[1]
    let 次版本 = 匹配[2]
    if (主版本 === undefined || 次版本 === undefined) {
      return null
    }
    return { 主版本: Number(主版本), 次版本: Number(次版本), 修订版本: Number(匹配[3] ?? '0'), 预发布: 匹配[4] ?? null }
  }
}
