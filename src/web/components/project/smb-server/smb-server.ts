import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { 组件基类 } from '../../../base/base'
import { SMB共享配置, SMB存储根, SMB服务器插件, SMB服务状态 } from '../../../global/native/smb-server'
import { 创建元素 } from '../../../global/tools/create-element'
import { 主要按钮, 危险按钮, 普通按钮 } from '../../general/base/base-button'
import { 复选框 } from '../../general/form/form-checkbox'
import { 密码输入框, 数字输入框, 普通输入框 } from '../../general/form/form-input'
import { 应用更新组件 } from '../app-updater/app-updater'

type 发出事件类型 = {}
type 监听事件类型 = {}
type 共享选择项 = { 配置: SMB存储根; 选择框: 复选框 }

export class SMB服务器组件 extends 组件基类<发出事件类型, 监听事件类型> {
  static {
    this.注册组件('lsby-smb-server', this)
  }

  private 状态元素 = 创建元素('p')
  private 地址元素 = 创建元素('p')
  private 提示元素 = 创建元素('p')
  private PC连接区域 = 创建元素('div')
  private PC说明元素 = 创建元素('p')
  private PC命令元素 = 创建元素('code')
  private 共享列表元素 = 创建元素('div')
  private 用户名输入 = new 普通输入框({ 值: 'android-smb', 输入处理函数: (): void => this.保存账号() })
  private 密码输入 = new 密码输入框({ 值: 'android-smb', 输入处理函数: (): void => this.保存账号() })
  private 端口输入 = new 数字输入框({ 值: '4450', 最小值: '1', 最大值: '65535', 步长: '1' })
  private 显示密码选择 = new 复选框({
    标签: '显示密码',
    值: false,
    变化处理函数: (显示: boolean): void => this.密码输入.设置类型(显示 ? 'text' : 'password'),
  })
  private 根模式选择 = new 复选框({
    标签: '启用 Root 模式',
    值: false,
    额外提示: '系统根和 1–1023 端口需要 Root。只有启动服务器时才会请求 Root 授权。',
    变化处理函数: (启用: boolean): void => this.更新默认端口(启用),
  })
  private 启动按钮 = new 主要按钮({
    文本: '启动服务器',
    点击处理函数: async (): Promise<void> => await this.启动服务器(),
  })
  private 停止按钮 = new 危险按钮({
    文本: '停止服务器',
    点击处理函数: async (): Promise<void> => await this.停止服务器(),
  })
  private 权限按钮 = new 普通按钮({
    文本: '授予所有文件访问权限',
    点击处理函数: async (): Promise<void> => await this.打开文件权限设置(),
  })
  private 复制命令按钮 = new 普通按钮({
    文本: '复制 PC 连接命令',
    点击处理函数: async (): Promise<void> => await this.复制PC连接命令(),
  })
  private 共享选择项列表: 共享选择项[] = []
  private 当前连接共享名列表 = ['internal']
  private 状态定时器: number | undefined

  protected override async 当加载时(): Promise<void> {
    this.获得宿主样式().display = 'block'
    this.获得宿主样式().width = '100%'
    this.获得宿主样式().height = '100%'
    let 页面 = 创建元素('main', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
        maxWidth: '720px',
        minHeight: '100%',
        margin: '0 auto',
        padding: '24px 18px 48px',
      },
    })
    页面.append(
      创建元素('h1', { textContent: 'Android SMB', style: { margin: '0', fontSize: '28px' } }),
      创建元素('p', {
        textContent: '把内部存储和 SD 卡作为可读写 SMB 共享，也可在 Root 模式下只读共享系统根。',
        style: { margin: '0', color: 'var(--次要文字颜色)', lineHeight: '1.6' },
      }),
      new 应用更新组件(),
      this.创建状态卡片(),
      this.创建账号卡片(),
      this.创建共享卡片(),
      this.创建Root卡片(),
      this.创建操作区域(),
    )
    this.shadow.append(页面)
    this.加载账号()
    if (Capacitor.isNativePlatform() === false) {
      this.提示元素.textContent = '请在 Android 应用中使用此页面。'
      this.启动按钮.设置禁用(true)
      this.停止按钮.设置禁用(true)
      this.权限按钮.设置禁用(true)
      return
    }
    await SMB服务器插件.requestNotificationPermission()
    await this.加载存储根目录()
    await this.刷新状态()
    this.状态定时器 = window.setInterval((): void => {
      this.刷新状态().catch((错误: unknown): void => this.显示错误(错误))
    }, 1000)
  }

  protected override async 当卸载时(): Promise<void> {
    if (this.状态定时器 !== undefined) {
      window.clearInterval(this.状态定时器)
      this.状态定时器 = undefined
    }
  }

  private 创建卡片(标题: string): HTMLDivElement {
    return 创建元素('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '18px',
        border: '1px solid var(--边框颜色)',
        borderRadius: '12px',
        backgroundColor: 'var(--卡片背景颜色)',
      },
      children: 创建元素('h2', { textContent: 标题, style: { margin: '0', fontSize: '18px' } }),
    })
  }

  private 创建状态卡片(): HTMLDivElement {
    let 卡片 = this.创建卡片('运行状态')
    this.状态元素.style.margin = '0'
    this.地址元素.style.margin = '0'
    this.地址元素.style.wordBreak = 'break-all'
    this.提示元素.style.margin = '0'
    this.提示元素.style.color = 'var(--次要文字颜色)'
    this.PC连接区域.style.display = 'none'
    this.PC连接区域.style.flexDirection = 'column'
    this.PC连接区域.style.gap = '10px'
    this.PC说明元素.style.margin = '0'
    this.PC说明元素.style.lineHeight = '1.6'
    this.PC命令元素.style.display = 'block'
    this.PC命令元素.style.padding = '12px'
    this.PC命令元素.style.borderRadius = '6px'
    this.PC命令元素.style.backgroundColor = 'var(--输入框背景)'
    this.PC命令元素.style.wordBreak = 'break-all'
    this.PC命令元素.style.whiteSpace = 'pre-wrap'
    this.PC连接区域.append(
      创建元素('h3', { textContent: 'PC 连接方法', style: { margin: '4px 0 0', fontSize: '16px' } }),
      this.PC说明元素,
      this.PC命令元素,
      this.复制命令按钮,
    )
    卡片.append(this.状态元素, this.地址元素, this.提示元素, this.权限按钮, this.PC连接区域)
    return 卡片
  }

  private 创建账号卡片(): HTMLDivElement {
    let 卡片 = this.创建卡片('连接配置')
    卡片.append(
      this.创建字段('监听端口', this.端口输入),
      this.创建字段('用户名', this.用户名输入),
      this.创建字段('密码', this.密码输入),
      this.显示密码选择,
    )
    return 卡片
  }

  private 创建字段(标签: string, 控件: HTMLElement): HTMLLabelElement {
    return 创建元素('label', {
      style: { display: 'flex', flexDirection: 'column', gap: '6px' },
      children: [创建元素('span', { textContent: 标签 }), 控件],
    })
  }

  private 创建共享卡片(): HTMLDivElement {
    let 卡片 = this.创建卡片('共享目录')
    this.共享列表元素.style.display = 'flex'
    this.共享列表元素.style.flexDirection = 'column'
    this.共享列表元素.style.gap = '10px'
    卡片.append(this.共享列表元素)
    return 卡片
  }

  private 创建Root卡片(): HTMLDivElement {
    let 卡片 = this.创建卡片('Root 模式')
    卡片.append(
      创建元素('p', {
        textContent: '不启用时直接点击“启动服务器”即以普通权限运行。启用后，点击启动才会请求 Root 授权。',
        style: { margin: '0', color: 'var(--次要文字颜色)', lineHeight: '1.6' },
      }),
      this.根模式选择,
    )
    return 卡片
  }

  private 创建操作区域(): HTMLDivElement {
    return 创建元素('div', {
      style: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
      children: [this.启动按钮, this.停止按钮],
    })
  }

  private async 加载存储根目录(): Promise<void> {
    let { roots } = await SMB服务器插件.getStorageRoots()
    this.共享选择项列表 = []
    this.共享列表元素.replaceChildren()
    for (let 配置 of roots) {
      let 选择框 = new 复选框({
        标签: `${配置.label} — ${配置.path}（${配置.access === 'read' ? '只读' : '读写'}${配置.requiresRoot ? '，需要 Root' : ''}）`,
        值: 配置.requiresRoot === false,
      })
      this.共享选择项列表.push({ 配置, 选择框 })
      this.共享列表元素.append(选择框)
    }
  }

  private 加载账号(): void {
    let 用户名 = window.localStorage.getItem('android-smb:username')
    let 密码 = window.localStorage.getItem('android-smb:password')
    if (用户名 !== null && 用户名 !== '') {
      this.用户名输入.设置值(用户名)
    }
    if (密码 !== null && 密码 !== '') {
      this.密码输入.设置值(密码)
    }
  }

  private 保存账号(): void {
    window.localStorage.setItem('android-smb:username', this.用户名输入.获得值())
    window.localStorage.setItem('android-smb:password', this.密码输入.获得值())
  }

  private async 启动服务器(): Promise<void> {
    try {
      this.启动按钮.设置禁用(true)
      let 端口 = Number(this.端口输入.获得值())
      if (Number.isInteger(端口) === false || 端口 < 1 || 端口 > 65535) {
        throw new Error('端口必须是 1–65535 之间的整数。')
      }
      let 启用Root = this.根模式选择.获得值()
      let 选中Root专用共享 = this.共享选择项列表.some(
        (选择项: 共享选择项): boolean => 选择项.配置.requiresRoot && 选择项.选择框.获得值(),
      )
      if (启用Root === false && (端口 < 1024 || 选中Root专用共享)) {
        throw new Error('当前配置包含 Root 专用权限，请先勾选“启用 Root 模式”。')
      }
      let 共享列表 = this.获得选中共享()
      let 首个共享 = 共享列表.at(0)
      if (首个共享 === undefined) {
        throw new Error('请至少选择一个共享目录。')
      }
      this.当前连接共享名列表 = 共享列表.map((共享: SMB共享配置): string => 共享.name)
      await SMB服务器插件.start({
        rootMode: 启用Root,
        port: 端口,
        username: this.用户名输入.获得值(),
        password: this.密码输入.获得值(),
        shares: 共享列表,
      })
      await this.刷新状态()
    } catch (错误: unknown) {
      this.启动按钮.设置禁用(false)
      await this.显示启动错误(错误)
    }
  }

  private async 停止服务器(): Promise<void> {
    try {
      await SMB服务器插件.stop()
      await this.刷新状态()
    } catch (错误: unknown) {
      this.显示错误(错误)
    }
  }

  private async 打开文件权限设置(): Promise<void> {
    try {
      await SMB服务器插件.openAllFilesAccessSettings()
    } catch (错误: unknown) {
      this.显示错误(错误)
    }
  }

  private 更新默认端口(启用Root: boolean): void {
    let 当前端口 = this.端口输入.获得值()
    if (启用Root && 当前端口 === '4450') {
      this.端口输入.设置值('445')
    } else if (启用Root === false && 当前端口 === '445') {
      this.端口输入.设置值('4450')
    }
  }

  private async 复制PC连接命令(): Promise<void> {
    let 命令 = this.PC命令元素.textContent
    if (命令 === '') {
      return
    }
    try {
      await navigator.clipboard.writeText(命令)
      this.提示元素.style.color = 'var(--成功颜色)'
      this.提示元素.textContent = 'PC 连接命令已复制。'
    } catch (错误: unknown) {
      this.显示错误(错误)
    }
  }

  private 获得选中共享(): SMB共享配置[] {
    let 结果: SMB共享配置[] = []
    for (let 选择项 of this.共享选择项列表) {
      if (选择项.选择框.获得值() === true) {
        结果.push({ name: 选择项.配置.name, path: 选择项.配置.path, access: 选择项.配置.access })
      }
    }
    return 结果
  }

  private async 显示启动错误(错误: unknown): Promise<void> {
    let 消息 = 错误 instanceof Error ? 错误.message : String(错误)
    await Dialog.alert({ title: '无法启动服务器', message: 消息, buttonTitle: '知道了' })
  }

  private async 刷新状态(): Promise<void> {
    this.渲染状态(await SMB服务器插件.getStatus())
  }

  private 渲染状态(状态: SMB服务状态): void {
    this.提示元素.style.color = 'var(--次要文字颜色)'
    this.状态元素.textContent = `状态：${状态.message}`
    let 模式 = 状态.rootMode ? 'Root' : '非 Root'
    this.地址元素.textContent =
      状态.ipAddress === '' ? `模式：${模式}，端口：${状态.port}` : `地址：${状态.ipAddress}，端口：${状态.port}`
    this.权限按钮.设置禁用(状态.allFilesAccess)
    switch (状态.state) {
      case 'stopped':
      case 'error':
        this.启动按钮.设置禁用(false)
        this.停止按钮.设置禁用(true)
        break
      case 'starting':
      case 'running':
      case 'stopping':
        this.启动按钮.设置禁用(true)
        this.停止按钮.设置禁用(false)
        break
    }
    if (状态.state === 'running' && 状态.ipAddress !== '') {
      let 端口参数 = 状态.port === 445 ? '' : ` /TCPPORT:${状态.port}`
      this.PC命令元素.textContent = this.当前连接共享名列表
        .map(
          (共享名: string): string =>
            `net use * \\\\${状态.ipAddress}\\${共享名}${端口参数} /user:${this.用户名输入.获得值()} * /persistent:yes`,
        )
        .join('\n')
      this.PC说明元素.textContent =
        状态.port === 445
          ? '推荐先给手机配置固定 IP，使手机始终使用同一个局域网地址。首次在 Windows 中逐行运行下面的命令，持久映射会保留盘符；以后只需在手机上启动服务，就能继续访问。第一个 * 会自动选择空闲盘符，用户名后面的 * 会提示输入密码。'
          : '推荐先给手机配置固定 IP，使手机始终使用同一个局域网地址。首次在 Windows 11 24H2 或更新版本中逐行运行下面的命令，持久映射会保留盘符；以后只需在手机上启动服务，就能继续访问。第一个 * 会自动选择空闲盘符，用户名后面的 * 会提示输入密码。'
      this.PC连接区域.style.display = 'flex'
      this.提示元素.textContent = ''
    } else if (状态.allFilesAccess === false) {
      this.PC连接区域.style.display = 'none'
      this.提示元素.textContent = '非 Root 模式启动前需要授予所有文件访问权限。'
    } else {
      this.PC连接区域.style.display = 'none'
      this.提示元素.textContent = ''
    }
  }

  private 显示错误(错误: unknown): void {
    this.提示元素.textContent = 错误 instanceof Error ? 错误.message : String(错误)
    this.提示元素.style.color = 'var(--错误颜色)'
  }
}
