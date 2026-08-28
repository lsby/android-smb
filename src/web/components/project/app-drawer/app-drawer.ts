import { 组件基类 } from '../../../base/base'
import { 创建元素, 应用样式 } from '../../../global/tools/create-element'
import { 普通按钮 } from '../../general/base/base-button'

type 发出事件类型 = {}
type 监听事件类型 = {}

let 第三方声明地址 = new URL('../../../../../THIRD_PARTY_NOTICES.md', import.meta.url).toString()

export class 应用侧栏组件 extends 组件基类<发出事件类型, 监听事件类型> {
  static {
    this.注册组件('android-smb-app-drawer', this)
  }

  private 打开按钮 = new 普通按钮({ 文本: '菜单', 点击处理函数: (): void => this.设置打开(true) })
  private 关闭按钮 = new 普通按钮({ 文本: '关闭', 点击处理函数: (): void => this.设置打开(false) })
  private 完整声明按钮 = new 普通按钮({
    文本: '查看完整许可文本',
    点击处理函数: async (): Promise<void> => await this.切换完整声明(),
  })
  private 遮罩层 = 创建元素('div')
  private 侧栏 = 创建元素('aside')
  private 边缘触摸区 = 创建元素('div')
  private 完整声明 = 创建元素('pre')
  private 起点X: number | null = null
  private 起点Y: number | null = null
  private 已打开 = false
  private 原页面滚动设置 = ''
  private 声明已加载 = false

  protected override async 当加载时(): Promise<void> {
    this.获得宿主样式().display = 'inline-block'
    this.配置触摸区()
    this.配置侧栏()
    this.shadow.append(this.打开按钮, this.边缘触摸区, this.遮罩层)
    this.设置打开(false)
  }

  protected override async 当卸载时(): Promise<void> {
    document.body.style.overflow = this.原页面滚动设置
  }

  private 配置触摸区(): void {
    应用样式(this.边缘触摸区, {
      position: 'fixed',
      top: '0',
      bottom: '0',
      left: '0',
      width: '24px',
      zIndex: '9998',
      touchAction: 'pan-y',
    })
    this.边缘触摸区.ariaLabel = '从此处向右滑动打开菜单'
    this.边缘触摸区.ontouchstart = (事件: TouchEvent): void => this.记录触摸起点(事件)
    this.边缘触摸区.ontouchend = (事件: TouchEvent): void => this.处理滑动结束(事件, true)
  }

  private 配置侧栏(): void {
    应用样式(this.遮罩层, {
      position: 'fixed',
      inset: '0',
      zIndex: '11000',
      backgroundColor: 'var(--遮罩颜色)',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 180ms ease',
    })
    this.遮罩层.onclick = (): void => this.设置打开(false)
    this.遮罩层.ontouchstart = (事件: TouchEvent): void => this.记录触摸起点(事件)
    this.遮罩层.ontouchend = (事件: TouchEvent): void => this.处理滑动结束(事件, false)
    应用样式(this.侧栏, {
      display: 'flex',
      position: 'absolute',
      top: '0',
      bottom: '0',
      left: '0',
      boxSizing: 'border-box',
      width: 'min(86vw, 390px)',
      overflowY: 'auto',
      flexDirection: 'column',
      gap: '18px',
      padding: 'max(22px, env(safe-area-inset-top)) 18px max(22px, env(safe-area-inset-bottom))',
      color: 'var(--文字颜色)',
      backgroundColor: 'var(--卡片背景颜色)',
      borderRight: '1px solid var(--边框颜色)',
      boxShadow: '8px 0 24px var(--深阴影颜色)',
      transform: 'translateX(-100%)',
      transition: 'transform 180ms ease',
      touchAction: 'pan-y',
    })
    this.侧栏.ariaLabel = 'Android SMB 菜单与开源许可证'
    this.侧栏.onclick = (事件: MouseEvent): void => 事件.stopPropagation()
    应用样式(this.完整声明, {
      display: 'none',
      margin: '0',
      padding: '14px',
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      border: '1px solid var(--边框颜色)',
      borderRadius: '8px',
      color: 'var(--次要文字颜色)',
      backgroundColor: 'var(--输入框背景)',
    })
    this.侧栏.append(
      创建元素('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
        children: [
          创建元素('h2', { textContent: 'Android SMB', style: { margin: '0', fontSize: '22px' } }),
          this.关闭按钮,
        ],
      }),
      创建元素('p', { textContent: '开源许可证', style: { margin: '4px 0 0', fontSize: '18px', fontWeight: 'bold' } }),
      this.创建许可摘要('Android SMB', 'MIT', 'Copyright © 2026 科达雅软件工作室'),
      this.创建许可摘要('rust-smb-server 0.4.0', 'MIT', 'Copyright © 2026 paltaio'),
      this.创建许可摘要('原生 Rust 依赖', '宽松开源许可证', 'MIT、Apache-2.0、BSD-3-Clause、Unicode-3.0 等'),
      this.完整声明按钮,
      this.完整声明,
    )
    this.遮罩层.append(this.侧栏)
  }

  private 创建许可摘要(名称: string, 协议: string, 说明: string): HTMLDivElement {
    return 创建元素('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '14px',
        border: '1px solid var(--边框颜色)',
        borderRadius: '10px',
        backgroundColor: 'var(--输入框背景)',
      },
      children: [
        创建元素('strong', { textContent: 名称 }),
        创建元素('span', { textContent: 协议, style: { color: 'var(--主色调)' } }),
        创建元素('span', { textContent: 说明, style: { color: 'var(--次要文字颜色)', lineHeight: '1.5' } }),
      ],
    })
  }

  private 设置打开(打开: boolean): void {
    this.已打开 = 打开
    this.遮罩层.style.opacity = 打开 ? '1' : '0'
    this.遮罩层.style.pointerEvents = 打开 ? 'auto' : 'none'
    this.侧栏.style.transform = 打开 ? 'translateX(0)' : 'translateX(-100%)'
    this.侧栏.ariaHidden = 打开 ? 'false' : 'true'
    this.边缘触摸区.style.pointerEvents = 打开 ? 'none' : 'auto'
    if (打开 === true) {
      this.原页面滚动设置 = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      window.setTimeout((): void => this.关闭按钮.按钮聚焦(), 190)
    } else {
      document.body.style.overflow = this.原页面滚动设置
    }
  }

  private 记录触摸起点(事件: TouchEvent): void {
    let 触摸点 = 事件.touches.item(0)
    if (触摸点 === null) return
    this.起点X = 触摸点.clientX
    this.起点Y = 触摸点.clientY
  }

  private 处理滑动结束(事件: TouchEvent, 目标为打开: boolean): void {
    let 触摸点 = 事件.changedTouches.item(0)
    if (触摸点 === null || this.起点X === null || this.起点Y === null) {
      this.清理触摸起点()
      return
    }
    let 横向距离 = 触摸点.clientX - this.起点X
    let 纵向距离 = 触摸点.clientY - this.起点Y
    if (Math.abs(横向距离) >= 64 && Math.abs(横向距离) > Math.abs(纵向距离)) {
      if (目标为打开 === true && 横向距离 > 0) this.设置打开(true)
      else if (目标为打开 === false && 横向距离 < 0 && this.已打开 === true) this.设置打开(false)
    }
    this.清理触摸起点()
  }

  private 清理触摸起点(): void {
    this.起点X = null
    this.起点Y = null
  }

  private async 切换完整声明(): Promise<void> {
    if (this.完整声明.style.display !== 'none') {
      this.完整声明.style.display = 'none'
      this.完整声明按钮.设置文本('查看完整许可文本')
      return
    }
    if (this.声明已加载 === false) {
      this.完整声明按钮.设置禁用(true)
      this.完整声明按钮.设置文本('正在加载…')
      try {
        let 响应 = await fetch(第三方声明地址)
        if (响应.ok === false) throw new Error(`读取许可声明失败，HTTP ${响应.status}`)
        this.完整声明.textContent = await 响应.text()
        this.声明已加载 = true
      } catch (错误: unknown) {
        this.完整声明.textContent = 错误 instanceof Error ? 错误.message : String(错误)
      } finally {
        this.完整声明按钮.设置禁用(false)
      }
    }
    this.完整声明.style.display = 'block'
    this.完整声明按钮.设置文本('收起完整许可文本')
  }
}
