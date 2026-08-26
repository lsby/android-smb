import { 组件基类 } from '../../base/base'
import { SMB服务器组件 } from './smb-server/smb-server'

type 发出事件类型 = {}
type 监听事件类型 = {}

export class 首页组件 extends 组件基类<发出事件类型, 监听事件类型> {
  static {
    this.注册组件('lsby-index', this)
  }

  protected override async 当加载时(): Promise<void> {
    this.style.display = 'block'
    this.style.minHeight = '100dvh'
    this.shadow.append(new SMB服务器组件())
  }
}
