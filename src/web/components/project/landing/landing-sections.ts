import { 创建元素 } from '../../../global/tools/create-element'

type 痛点项 = { 编号: string; 标题: string; 描述: string }
type 导航项 = { 文本: string; 目标: HTMLElement }

let 工作室标识图片 = new URL('../../../../../public/kedaya-logo.svg', import.meta.url).toString()
let 项目标识图片 = new URL('../../../../../public/android-smb-logo.svg', import.meta.url).toString()

export function 创建头部(导航列表: 导航项[]): HTMLElement {
  return 创建元素('header', {
    className: 'site-header',
    children: 创建元素('div', {
      className: 'container header-inner',
      children: [
        创建元素('div', {
          className: 'brand-system',
          children: [
            创建元素('a', {
              className: 'studio-brand',
              href: 'https://hbybyyang.cn/',
              target: '_blank',
              rel: 'noreferrer',
              ariaLabel: '科达雅软件工作室主页',
              children: 创建元素('img', { className: 'studio-logo', src: 工作室标识图片, alt: '科达雅软件工作室' }),
            }),
            创建元素('span', { className: 'brand-separator', textContent: '×', ariaHidden: 'true' }),
            创建元素('a', {
              className: 'project-brand',
              href: './',
              ariaLabel: 'Android SMB 首页',
              children: [
                创建元素('img', { className: 'project-logo', src: 项目标识图片, alt: 'Android SMB' }),
                创建元素('span', { className: 'project-name', textContent: 'Android SMB' }),
              ],
            }),
          ],
        }),
        创建元素('nav', {
          className: 'nav',
          ariaLabel: '页面导航',
          children: 导航列表.map(
            (导航: 导航项): HTMLButtonElement =>
              创建元素('button', {
                type: 'button',
                className: 'nav-button',
                textContent: 导航.文本,
                onclick: (): void => 导航.目标.scrollIntoView({ behavior: 'smooth', block: 'start' }),
              }),
          ),
        }),
        创建元素('a', {
          className: 'github-link',
          href: 'https://github.com/lsby/android-smb',
          target: '_blank',
          rel: 'noreferrer',
          textContent: '查看源码',
        }),
      ],
    }),
  })
}

export function 创建痛点区(): HTMLElement {
  let 痛点列表: 痛点项[] = [
    {
      编号: '01',
      标题: '手机不适合复杂整理',
      描述: '小屏幕和触控操作适合浏览，却不适合批量选择、跨目录移动、重命名和整理大量文件。',
    },
    {
      编号: '02',
      标题: '应用内操作割裂',
      描述: '不同应用的文件入口和能力各不相同，路径难找、功能受限，整理工作很容易被打断。',
    },
    {
      编号: '03',
      标题: 'USB 连接成本太高',
      描述: '临时传个文件还要找线、插线、切换连接模式；接口、驱动和线材状态也可能带来额外问题。',
    },
    {
      编号: '04',
      标题: 'WebDAV 难扛复杂操作',
      描述: '在部分客户端中，批量移动、重命名、深层目录管理和长时间传输的体验不如原生 SMB 文件共享。',
    },
  ]
  return 创建元素('section', {
    style: { padding: '96px 0', color: '#eef8f8', backgroundColor: 'var(--landing-code)' },
    children: 创建元素('div', {
      style: { width: 'min(1160px, calc(100% - 40px))', margin: '0 auto' },
      children: [
        创建元素('p', {
          textContent: 'The problem',
          style: {
            margin: '0 0 10px',
            color: 'var(--landing-lime)',
            fontSize: '13px',
            fontWeight: '800',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          },
        }),
        创建元素('h2', {
          textContent: '文件在手机里，管理却不该困在手机上',
          style: {
            maxWidth: '760px',
            margin: '0',
            fontSize: 'clamp(32px, 4vw, 46px)',
            lineHeight: '1.15',
            letterSpacing: '-0.045em',
          },
        }),
        创建元素('p', {
          textContent: '过去，为了在手机中整理或传输大量文件，你往往只能在几个都不理想的方案之间反复切换。',
          style: { maxWidth: '680px', margin: '18px 0 0', color: '#91a9b2', fontSize: '16px', lineHeight: '1.75' },
        }),
        创建元素('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '48px',
          },
          children: 痛点列表.map(
            (痛点: 痛点项): HTMLElement =>
              创建元素('article', {
                style: {
                  padding: '26px',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.045)',
                },
                children: [
                  创建元素('span', {
                    textContent: 痛点.编号,
                    style: {
                      color: 'var(--landing-lime)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                      fontSize: '12px',
                      fontWeight: '800',
                    },
                  }),
                  创建元素('h3', { textContent: 痛点.标题, style: { margin: '24px 0 10px', fontSize: '19px' } }),
                  创建元素('p', {
                    textContent: 痛点.描述,
                    style: { margin: '0', color: '#91a9b2', fontSize: '14px', lineHeight: '1.75' },
                  }),
                ],
              }),
          ),
        }),
      ],
    }),
  })
}

export function 创建模式卡片(
  标签: string,
  标题: string,
  描述: string,
  列表: string[],
  强调: boolean = false,
): HTMLElement {
  return 创建元素('article', {
    className: 强调 ? 'mode-card mode-card-highlight' : 'mode-card',
    children: [
      创建元素('span', { className: 'mode-tag', textContent: 标签 }),
      创建元素('h3', { textContent: 标题 }),
      创建元素('p', { textContent: 描述 }),
      创建元素('ul', {
        className: 'mode-list',
        children: 列表.map((项目: string): HTMLLIElement => 创建元素('li', { textContent: 项目 })),
      }),
    ],
  })
}

export function 创建行动区(): HTMLElement {
  return 创建元素('section', {
    className: 'cta',
    children: 创建元素('div', {
      className: 'cta-panel',
      children: [
        创建元素('h2', { textContent: '在电脑上管理手机文件' }),
        创建元素('p', { textContent: '开源、局域网直连、Root 可选。现在就把 Android 设备接入你的日常文件工作流。' }),
        创建元素('a', {
          className: 'button button-primary',
          href: 'https://github.com/lsby/android-smb/releases',
          target: '_blank',
          rel: 'noreferrer',
          textContent: '前往 GitHub Releases',
        }),
      ],
    }),
  })
}

export function 创建页脚(): HTMLElement {
  return 创建元素('footer', {
    className: 'footer',
    children: 创建元素('div', {
      className: 'container footer-inner',
      children: [
        创建元素('span', { textContent: '© 2026 科达雅软件工作室 · Android SMB' }),
        创建元素('div', {
          className: 'footer-links',
          children: [
            创建元素('a', {
              href: 'https://hbybyyang.cn/',
              target: '_blank',
              rel: 'noreferrer',
              textContent: '工作室主页',
            }),
            创建元素('a', {
              href: 'https://beian.miit.gov.cn/',
              target: '_blank',
              rel: 'noreferrer',
              textContent: '新ICP备2026003876号-1',
            }),
            创建元素('a', {
              href: 'https://beian.mps.gov.cn/#/query/webSearch?code=65010402002238',
              target: '_blank',
              rel: 'noreferrer',
              textContent: '新公网安备65010402002238号',
            }),
          ],
        }),
      ],
    }),
  })
}
