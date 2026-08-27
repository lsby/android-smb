import { Capacitor } from '@capacitor/core'
import { 组件基类 } from '../../../base/base'
import { 创建元素 } from '../../../global/tools/create-element'
import { 创建头部, 创建模式卡片, 创建痛点区, 创建行动区, 创建页脚 } from './landing-sections'

type 发出事件类型 = {}
type 监听事件类型 = {}
type 特性项 = { 编号: string; 标题: string; 描述: string }
type 步骤项 = { 编号: string; 标题: string; 描述: string }

export class AndroidSMB落地页组件 extends 组件基类<发出事件类型, 监听事件类型> {
  static {
    this.注册组件('android-smb-landing', this)
  }

  private 特性区域 = 创建元素('section', { id: 'features', className: 'section section-soft' })
  private 模式区域 = 创建元素('section', { id: 'modes', className: 'section' })
  private 使用区域 = 创建元素('section', { id: 'guide', className: 'section section-soft' })

  protected override async 当加载时(): Promise<void> {
    if (Capacitor.isNativePlatform() === true) {
      window.location.replace('./app.html')
      return
    }
    this.获得宿主样式().display = 'block'
    this.获得宿主样式().minHeight = '100dvh'
    this.shadow.append(
      this.创建样式(),
      创建元素('div', {
        className: 'page-shell',
        children: [
          创建元素('div', { className: 'ambient ambient-one' }),
          创建元素('div', { className: 'ambient ambient-two' }),
          创建头部([
            { 文本: '核心能力', 目标: this.特性区域 },
            { 文本: '运行模式', 目标: this.模式区域 },
            { 文本: '使用方法', 目标: this.使用区域 },
          ]),
          创建元素('main', {
            children: [
              this.创建英雄区(),
              创建痛点区(),
              this.创建特性区(),
              this.创建模式区(),
              this.创建使用区(),
              创建行动区(),
            ],
          }),
          创建页脚(),
        ],
      }),
    )
  }

  private 创建样式(): HTMLStyleElement {
    return 创建元素('style', {
      textContent: `
        :host {
          --landing-bg: #f7fafc;
          --landing-surface: rgba(255, 255, 255, 0.82);
          --landing-surface-solid: #ffffff;
          --landing-soft: #eef5f8;
          --landing-text: #10202c;
          --landing-muted: #58707f;
          --landing-border: rgba(25, 75, 94, 0.14);
          --landing-accent: #087f8c;
          --landing-accent-strong: #056773;
          --landing-lime: #b9e769;
          --landing-code: #071723;
          display: block;
          min-height: 100dvh;
          color: var(--landing-text);
          background: var(--landing-bg);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        *, *::before, *::after { box-sizing: border-box; }
        button, a { font: inherit; }
        button:focus-visible, a:focus-visible { outline: 3px solid rgba(8, 127, 140, 0.35); outline-offset: 3px; }
        .page-shell { position: relative; min-height: 100dvh; overflow: hidden; background: var(--landing-bg); }
        .ambient { position: absolute; border-radius: 999px; filter: blur(2px); pointer-events: none; }
        .ambient-one { width: 520px; height: 520px; top: -260px; right: -130px; background: rgba(185, 231, 105, 0.24); }
        .ambient-two { width: 420px; height: 420px; top: 420px; left: -300px; background: rgba(8, 127, 140, 0.12); }
        .container { position: relative; width: min(1160px, calc(100% - 40px)); margin: 0 auto; }
        .site-header { position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--landing-border); background: rgba(247, 250, 252, 0.84); backdrop-filter: blur(18px); }
        .header-inner { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .brand-system { display: flex; align-items: center; gap: 12px; min-width: 274px; }
        .studio-brand, .project-brand { display: inline-flex; align-items: center; color: var(--landing-text); text-decoration: none; }
        .studio-brand, .project-logo { transition: transform 160ms ease, filter 160ms ease; }
        .studio-brand:hover { transform: scale(1.08); filter: drop-shadow(0 0 9px rgba(168, 85, 247, 0.38)); }
        .studio-logo { display: block; width: 36px; height: 36px; object-fit: contain; }
        .brand-separator { color: var(--landing-muted); font-size: 17px; font-weight: 800; user-select: none; }
        .project-brand { gap: 10px; font-weight: 850; letter-spacing: -0.035em; }
        .project-brand:hover .project-logo { transform: scale(1.07); filter: drop-shadow(0 0 9px rgba(34, 184, 199, 0.38)); }
        .project-logo { display: block; width: 40px; height: 40px; object-fit: contain; }
        .project-name { font-size: 20px; background: linear-gradient(135deg, var(--landing-text), var(--landing-accent)); background-clip: text; -webkit-background-clip: text; color: transparent; }
        .nav { display: flex; align-items: center; gap: 4px; }
        .nav-button { padding: 10px 13px; border: 0; background: transparent; color: var(--landing-muted); border-radius: 9px; cursor: pointer; }
        .nav-button:hover { color: var(--landing-text); background: rgba(8, 127, 140, 0.07); }
        .github-link { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 17px; border-radius: 11px; background: var(--landing-text); color: var(--landing-bg); text-decoration: none; font-weight: 700; }
        .hero { position: relative; min-height: 700px; display: grid; grid-template-columns: 1.08fr 0.92fr; align-items: center; gap: 72px; padding: 84px 0 96px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 9px; padding: 7px 12px; margin-bottom: 24px; border: 1px solid rgba(8, 127, 140, 0.18); border-radius: 999px; color: var(--landing-accent-strong); background: rgba(8, 127, 140, 0.07); font-size: 13px; font-weight: 750; }
        .eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--landing-lime); box-shadow: 0 0 0 5px rgba(185, 231, 105, 0.22); }
        .hero-title { max-width: 680px; margin: 0; font-size: clamp(48px, 6vw, 76px); line-height: 1.02; letter-spacing: -0.065em; font-weight: 850; }
        .hero-title-accent { display: block; color: var(--landing-accent); }
        .hero-description { max-width: 630px; margin: 28px 0 0; color: var(--landing-muted); font-size: 18px; line-height: 1.8; }
        .hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: 36px; }
        .button { min-height: 50px; display: inline-flex; align-items: center; justify-content: center; padding: 0 22px; border-radius: 13px; text-decoration: none; font-weight: 780; transition: transform 160ms ease, box-shadow 160ms ease; }
        .button:hover { transform: translateY(-2px); }
        .button-primary { color: #ffffff; background: var(--landing-accent); box-shadow: 0 14px 30px rgba(8, 127, 140, 0.24); }
        .button-primary:hover { background: var(--landing-accent-strong); box-shadow: 0 18px 34px rgba(8, 127, 140, 0.3); }
        .button-secondary { color: var(--landing-text); background: var(--landing-surface-solid); border: 1px solid var(--landing-border); }
        .hero-meta { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 32px; color: var(--landing-muted); font-size: 13px; }
        .hero-meta span::before { content: ''; display: inline-block; width: 6px; height: 6px; margin: 0 8px 2px 0; border-radius: 50%; background: var(--landing-accent); }
        .device-stage { position: relative; min-height: 510px; display: grid; place-items: center; }
        .device-orbit { position: absolute; width: 440px; height: 440px; border: 1px solid rgba(8, 127, 140, 0.14); border-radius: 50%; }
        .device-orbit::before, .device-orbit::after { content: ''; position: absolute; inset: 42px; border: 1px dashed rgba(8, 127, 140, 0.14); border-radius: 50%; }
        .device-orbit::after { inset: 104px; border-style: solid; }
        .phone { position: relative; z-index: 2; width: 278px; padding: 10px; border-radius: 40px; background: #07131d; box-shadow: 0 42px 80px rgba(7, 23, 35, 0.28), 0 0 0 1px rgba(255,255,255,0.18) inset; transform: rotate(2deg); }
        .phone-screen { min-height: 500px; padding: 28px 18px 20px; border-radius: 31px; color: #ecf5f5; background: linear-gradient(160deg, #0d2830, #07141f 68%); }
        .phone-status { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; color: #90a9ae; font-size: 11px; }
        .server-label { color: #8ca9ae; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; }
        .server-state { display: flex; align-items: center; gap: 10px; margin: 8px 0 6px; font-size: 26px; font-weight: 800; }
        .server-state-dot { width: 11px; height: 11px; border-radius: 50%; background: var(--landing-lime); box-shadow: 0 0 18px rgba(185, 231, 105, 0.8); }
        .server-address { margin-bottom: 24px; color: #8ea6ad; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
        .share-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px; margin-top: 10px; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; background: rgba(255,255,255,0.055); }
        .share-name { font-size: 13px; font-weight: 750; }
        .share-path { margin-top: 4px; color: #789197; font-size: 10px; }
        .share-access { padding: 5px 8px; border-radius: 999px; color: #cceb96; background: rgba(185,231,105,0.1); font-size: 10px; white-space: nowrap; }
        .stop-bar { width: 100%; min-height: 42px; margin-top: 22px; border: 0; border-radius: 12px; color: #082129; background: var(--landing-lime); font-weight: 800; }
        .floating-chip { position: absolute; z-index: 3; padding: 12px 14px; border: 1px solid var(--landing-border); border-radius: 13px; color: var(--landing-text); background: var(--landing-surface); backdrop-filter: blur(16px); box-shadow: 0 18px 34px rgba(31, 70, 83, 0.12); font-size: 12px; font-weight: 750; }
        .chip-one { top: 98px; left: -12px; }
        .chip-two { right: -12px; bottom: 112px; }
        .section { position: relative; padding: 104px 0; scroll-margin-top: 24px; }
        .section-soft { background: var(--landing-soft); }
        .section-inner { width: min(1160px, calc(100% - 40px)); margin: 0 auto; }
        .section-kicker { margin: 0 0 10px; color: var(--landing-accent); font-size: 13px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
        .section-title { max-width: 700px; margin: 0; font-size: clamp(32px, 4vw, 46px); line-height: 1.15; letter-spacing: -0.045em; text-wrap: balance; }
        .section-description { max-width: 680px; margin: 18px 0 0; color: var(--landing-muted); font-size: 16px; line-height: 1.75; }
        .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 48px; }
        .feature-card { min-height: 270px; padding: 30px; border: 1px solid var(--landing-border); border-radius: 20px; background: var(--landing-surface); transition: transform 180ms ease, border-color 180ms ease; }
        .feature-card:hover { transform: translateY(-5px); border-color: rgba(8, 127, 140, 0.34); }
        .feature-number { width: 42px; height: 42px; display: grid; place-items: center; margin-bottom: 42px; border-radius: 12px; color: var(--landing-accent); background: rgba(8, 127, 140, 0.09); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-weight: 800; }
        .feature-card h3 { margin: 0 0 13px; font-size: 20px; letter-spacing: -0.02em; }
        .feature-card p { margin: 0; color: var(--landing-muted); line-height: 1.75; font-size: 14px; }
        .mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 48px; }
        .mode-card { position: relative; overflow: hidden; padding: 34px; border: 1px solid var(--landing-border); border-radius: 24px; background: var(--landing-surface-solid); }
        .mode-card-highlight { color: #eaf6f7; border-color: transparent; background: var(--landing-code); }
        .mode-tag { display: inline-flex; padding: 6px 10px; border-radius: 999px; color: var(--landing-accent-strong); background: rgba(8,127,140,0.09); font-size: 12px; font-weight: 800; }
        .mode-card-highlight .mode-tag { color: #d8f4a9; background: rgba(185,231,105,0.11); }
        .mode-card h3 { margin: 22px 0 10px; font-size: 27px; letter-spacing: -0.035em; }
        .mode-card p { margin: 0; color: var(--landing-muted); line-height: 1.7; }
        .mode-card-highlight p { color: #91a9b2; }
        .mode-list { display: grid; gap: 12px; margin: 28px 0 0; padding: 0; list-style: none; }
        .mode-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.55; }
        .mode-list li::before { content: ''; width: 7px; height: 7px; flex: 0 0 auto; margin-top: 7px; border-radius: 50%; background: var(--landing-accent); }
        .mode-card-highlight .mode-list li::before { background: var(--landing-lime); }
        .steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(28px, 4vw, 56px); margin-top: 50px; }
        .step { position: relative; min-width: 0; padding-top: 24px; border-top: 1px solid var(--landing-border); }
        .step::before { content: ''; position: absolute; top: -2px; left: 0; width: 44px; height: 3px; border-radius: 999px; background: var(--landing-accent); }
        .step-number { display: block; color: var(--landing-accent); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; }
        .step h3 { margin: 18px 0 10px; font-size: 20px; letter-spacing: -0.025em; }
        .step p { max-width: 32ch; margin: 0; color: var(--landing-muted); font-size: 14px; line-height: 1.75; }
        .command-panel { position: relative; display: grid; grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.28fr); align-items: center; gap: clamp(32px, 5vw, 72px); overflow: hidden; margin-top: 68px; padding: clamp(32px, 4vw, 48px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; color: #e8f3f5; background: linear-gradient(135deg, #071723 0%, #040b11 100%); box-shadow: 0 28px 60px rgba(4, 18, 27, 0.14); }
        .command-panel::after { content: ''; position: absolute; width: 240px; height: 240px; right: -120px; bottom: -170px; border-radius: 50%; background: rgba(37, 178, 184, 0.11); filter: blur(2px); }
        .command-panel > * { position: relative; z-index: 1; min-width: 0; }
        .command-panel h3 { margin: 0 0 12px; font-size: clamp(22px, 2.3vw, 28px); letter-spacing: -0.035em; }
        .command-panel p { max-width: 44ch; margin: 0; color: #91aab5; line-height: 1.75; font-size: 14px; }
        .command { display: block; width: 100%; min-width: 0; overflow-wrap: anywhere; padding: 22px 24px; border: 1px solid rgba(185,231,105,0.12); border-radius: 14px; color: #c9ee8c; background: rgba(0,0,0,0.24); box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: clamp(12px, 1vw, 14px); line-height: 1.6; white-space: pre-wrap; }
        .cta { padding: 108px 0; text-align: center; }
        .cta-panel { width: min(920px, calc(100% - 40px)); margin: 0 auto; padding: 64px 40px; border-radius: 28px; color: #eef8f8; background: linear-gradient(145deg, #087f8c, #075563); box-shadow: 0 30px 70px rgba(8, 87, 99, 0.22); }
        .cta-panel h2 { margin: 0; font-size: clamp(34px, 5vw, 52px); letter-spacing: -0.05em; }
        .cta-panel p { max-width: 580px; margin: 18px auto 30px; color: #c1dadd; line-height: 1.75; }
        .cta-panel .button-primary { color: #10202c; background: var(--landing-lime); box-shadow: none; }
        .footer { padding: 38px 0; border-top: 1px solid var(--landing-border); color: var(--landing-muted); font-size: 13px; }
        .footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
        .footer-links { display: flex; gap: 18px; flex-wrap: wrap; }
        .footer a { color: inherit; text-decoration: none; }
        .footer a:hover { color: var(--landing-accent); }
        @media (prefers-reduced-motion: reduce) { .button, .feature-card { transition: none; } }
        @media (max-width: 900px) {
          .nav { display: none; }
          .hero { grid-template-columns: 1fr; gap: 46px; padding-top: 68px; }
          .hero-copy { text-align: center; }
          .hero-description { margin-left: auto; margin-right: auto; }
          .hero-actions, .hero-meta { justify-content: center; }
          .device-stage { min-height: 560px; }
          .feature-grid { grid-template-columns: 1fr; }
          .feature-card { min-height: 0; }
          .feature-number { margin-bottom: 24px; }
          .command-panel { grid-template-columns: 1fr; gap: 24px; }
        }
        @media (max-width: 640px) {
          .container, .section-inner { width: min(100% - 28px, 1160px); }
          .header-inner { min-height: 66px; }
          .brand-system { min-width: 0; gap: 8px; }
          .studio-logo { width: 30px; height: 30px; }
          .project-logo { width: 34px; height: 34px; }
          .project-name { font-size: 16px; }
          .github-link { min-height: 38px; padding: 0 13px; font-size: 13px; }
          .hero { min-height: 0; padding: 60px 0 74px; }
          .hero-title { font-size: 44px; }
          .hero-description { font-size: 16px; }
          .hero-actions { align-items: stretch; flex-direction: column; }
          .button { width: 100%; }
          .device-stage { min-height: 500px; transform: scale(0.88); margin: -22px -24px; }
          .device-orbit { width: 400px; height: 400px; }
          .chip-one { left: 0; }
          .chip-two { right: 0; }
          .section { padding: 78px 0; }
          .mode-grid, .steps { grid-template-columns: 1fr; }
          .steps { gap: 30px; }
          .step { padding-top: 18px; }
          .step p { max-width: none; }
          .mode-card, .feature-card, .command-panel { padding: 24px; }
          .command-panel { margin-top: 48px; }
          .cta { padding: 78px 0; }
          .cta-panel { width: calc(100% - 28px); padding: 48px 24px; }
          .footer-inner { align-items: flex-start; flex-direction: column; }
        }
        @media (max-width: 420px) { .project-name { display: none; } }
        :host-context(html[data-theme='dark']) {
          --landing-bg: #07111a;
          --landing-surface: rgba(16, 35, 45, 0.82);
          --landing-surface-solid: #0d202b;
          --landing-soft: #091722;
          --landing-text: #eef7f8;
          --landing-muted: #91aab5;
          --landing-border: rgba(164, 205, 214, 0.14);
          --landing-accent: #25b2b8;
          --landing-accent-strong: #6cd3d5;
          --landing-code: #040b11;
        }
        :host-context(html[data-theme='dark']) .site-header { background: rgba(7, 17, 26, 0.84); }
        :host-context(html[data-theme='dark']) .github-link { color: #07111a; background: #eef7f8; }
      `,
    })
  }

  private 创建英雄区(): HTMLElement {
    return 创建元素('section', {
      className: 'container hero',
      children: [
        创建元素('div', {
          className: 'hero-copy',
          children: [
            创建元素('div', {
              className: 'eyebrow',
              children: [
                创建元素('span', { className: 'eyebrow-dot' }),
                创建元素('span', { textContent: '无需 Root 即可开始' }),
              ],
            }),
            创建元素('h1', {
              className: 'hero-title',
              children: [
                '把 Android 手机',
                创建元素('span', { className: 'hero-title-accent', textContent: '变成局域网共享盘' }),
              ],
            }),
            创建元素('p', {
              className: 'hero-description',
              textContent:
                '文件都在手机里，但小屏幕并不适合整理大量目录；找 USB 线很麻烦，WebDAV 面对复杂操作也常常力不从心。Android SMB 让你直接用电脑熟悉的文件管理器处理手机存储。',
            }),
            创建元素('div', {
              className: 'hero-actions',
              children: [
                创建元素('a', {
                  className: 'button button-primary',
                  href: 'https://github.com/lsby/android-smb/releases',
                  target: '_blank',
                  rel: 'noreferrer',
                  textContent: '下载 Android APK',
                }),
                创建元素('a', {
                  className: 'button button-secondary',
                  href: 'https://github.com/lsby/android-smb',
                  target: '_blank',
                  rel: 'noreferrer',
                  textContent: '阅读项目源码',
                }),
              ],
            }),
            创建元素('div', {
              className: 'hero-meta',
              children: [
                创建元素('span', { textContent: 'Android 6.0+' }),
                创建元素('span', { textContent: 'ARM64' }),
                创建元素('span', { textContent: 'SMB2/3' }),
              ],
            }),
          ],
        }),
        this.创建设备演示(),
      ],
    })
  }

  private 创建设备演示(): HTMLElement {
    let 创建共享卡片 = (名称: string, 路径: string, 权限: string): HTMLElement =>
      创建元素('div', {
        className: 'share-card',
        children: [
          创建元素('div', {
            children: [
              创建元素('div', { className: 'share-name', textContent: 名称 }),
              创建元素('div', { className: 'share-path', textContent: 路径 }),
            ],
          }),
          创建元素('span', { className: 'share-access', textContent: 权限 }),
        ],
      })
    return 创建元素('div', {
      className: 'device-stage',
      ariaLabel: 'Android SMB 运行界面示意图',
      children: [
        创建元素('div', { className: 'device-orbit' }),
        创建元素('div', { className: 'floating-chip chip-one', textContent: '局域网直连' }),
        创建元素('div', { className: 'floating-chip chip-two', textContent: '前台服务守护' }),
        创建元素('div', {
          className: 'phone',
          children: 创建元素('div', {
            className: 'phone-screen',
            children: [
              创建元素('div', {
                className: 'phone-status',
                children: [创建元素('span', { textContent: '09:41' }), 创建元素('span', { textContent: 'LAN 100%' })],
              }),
              创建元素('div', { className: 'server-label', textContent: 'SMB SERVER' }),
              创建元素('div', {
                className: 'server-state',
                children: [
                  创建元素('span', { className: 'server-state-dot' }),
                  创建元素('span', { textContent: '正在运行' }),
                ],
              }),
              创建元素('div', { className: 'server-address', textContent: '192.168.8.150 : 4450' }),
              创建共享卡片('internal', '/storage/emulated/0', '读写'),
              创建共享卡片('sdcard', '/storage/4A12-18F3', '读写'),
              创建共享卡片('system', '/', 'Root 只读'),
              创建元素('button', { className: 'stop-bar', type: 'button', textContent: '停止服务器', tabIndex: -1 }),
            ],
          }),
        }),
      ],
    })
  }

  private 创建特性区(): HTMLElement {
    let 特性列表: 特性项[] = [
      {
        编号: '01',
        标题: '普通模式直接使用',
        描述: '无需修改 iptables、sysctl 或系统 SMB 配置。在 1024–65535 端口运行，默认使用 4450。',
      },
      {
        编号: '02',
        标题: '多存储根共享',
        描述: '内部存储和检测到的可移除 SD 卡均可作为独立共享，支持同时挂载和读写。',
      },
      {
        编号: '03',
        标题: '生命周期可控',
        描述: 'Android 前台服务管理 SMB 子进程。控制进程消失或通信管道断开时，服务器会退出并释放端口。',
      },
    ]
    this.特性区域.replaceChildren(
      创建元素('div', {
        className: 'section-inner',
        children: [
          创建元素('p', { className: 'section-kicker', textContent: 'Core capabilities' }),
          创建元素('h2', { className: 'section-title', textContent: '把复杂管理交给电脑，把存储留在手机' }),
          创建元素('p', {
            className: 'section-description',
            textContent: '无需把文件先复制出来，也无需适应另一套管理界面。手机负责提供存储，电脑负责高效整理。',
          }),
          创建元素('div', {
            className: 'feature-grid',
            children: 特性列表.map(
              (特性: 特性项): HTMLElement =>
                创建元素('article', {
                  className: 'feature-card',
                  children: [
                    创建元素('div', { className: 'feature-number', textContent: 特性.编号 }),
                    创建元素('h3', { textContent: 特性.标题 }),
                    创建元素('p', { textContent: 特性.描述 }),
                  ],
                }),
            ),
          }),
        ],
      }),
    )
    return this.特性区域
  }

  private 创建模式区(): HTMLElement {
    this.模式区域.replaceChildren(
      创建元素('div', {
        className: 'section-inner',
        children: [
          创建元素('p', { className: 'section-kicker', textContent: 'Two modes' }),
          创建元素('h2', { className: 'section-title', textContent: '权限由你决定，Root 从来不是默认项' }),
          创建元素('p', {
            className: 'section-description',
            textContent: '应用只会在你主动勾选 Root 模式并点击启动时申请授权。日常使用推荐普通模式。',
          }),
          创建元素('div', {
            className: 'mode-grid',
            children: [
              创建模式卡片('推荐', '普通模式', '适合日常在电脑与手机之间传文件。', [
                '端口范围 1024–65535，默认 4450',
                '内部存储与 SD 卡读写共享',
                '不申请 Root 权限',
              ]),
              创建模式卡片(
                '按需启用',
                'Root 模式',
                '用于必须监听标准端口或读取系统根目录的场景。',
                ['端口范围 1–65535，可使用标准 445', '系统根目录固定为只读共享', '仅在点击启动时请求 Root 授权'],
                true,
              ),
            ],
          }),
        ],
      }),
    )
    return this.模式区域
  }

  private 创建使用区(): HTMLElement {
    let 步骤列表: 步骤项[] = [
      { 编号: 'STEP 01', 标题: '安装 APK', 描述: '从 GitHub Releases 下载并安装适用于 ARM64 Android 设备的安装包。' },
      { 编号: 'STEP 02', 标题: '授予文件权限', 描述: '按应用提示开启“所有文件访问权限”，让普通模式可以访问共享目录。' },
      { 编号: 'STEP 03', 标题: '启动并映射', 描述: '配置并启动服务，在 Windows 中运行应用生成的持久映射命令。' },
    ]
    this.使用区域.replaceChildren(
      创建元素('div', {
        className: 'section-inner',
        children: [
          创建元素('p', { className: 'section-kicker', textContent: 'Quick start' }),
          创建元素('h2', { className: 'section-title', textContent: '从安装到挂载，只需要三步' }),
          创建元素('div', {
            className: 'steps',
            children: 步骤列表.map(
              (步骤: 步骤项): HTMLElement =>
                创建元素('article', {
                  className: 'step',
                  children: [
                    创建元素('span', { className: 'step-number', textContent: 步骤.编号 }),
                    创建元素('h3', { textContent: 步骤.标题 }),
                    创建元素('p', { textContent: 步骤.描述 }),
                  ],
                }),
            ),
          }),
          创建元素('div', {
            className: 'command-panel',
            children: [
              创建元素('div', {
                children: [
                  创建元素('h3', { textContent: '推荐：固定 IP + 持久映射' }),
                  创建元素('p', {
                    textContent:
                      '首次连接前给手机配置固定 IP。Windows 会保留映射，以后只需打开 Android SMB 并启动服务，手机文件就会重新出现在原来的盘符中。非标准端口需要 Windows 11 24H2 或更新版本。',
                  }),
                ],
              }),
              创建元素('code', {
                className: 'command',
                textContent: 'net use * \\\\192.168.8.150\\internal /TCPPORT:4450 /user:android-smb * /persistent:yes',
              }),
            ],
          }),
        ],
      }),
    )
    return this.使用区域
  }
}
