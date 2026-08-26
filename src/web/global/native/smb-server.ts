import { registerPlugin } from '@capacitor/core'

export type SMB共享权限 = 'read' | 'readWrite'

export type SMB共享配置 = { name: string; path: string; access: SMB共享权限 }

export type SMB存储根 = SMB共享配置 & { label: string; removable: boolean; requiresRoot: boolean }

export type SMB服务状态 = {
  state: 'stopped' | 'starting' | 'running' | 'stopping' | 'error'
  message: string
  rootMode: boolean
  port: number
  ipAddress: string
  allFilesAccess: boolean
}

type SMB服务器原生插件 = {
  start(配置: {
    rootMode: boolean
    port: number
    username: string
    password: string
    shares: SMB共享配置[]
  }): Promise<SMB服务状态>
  stop(): Promise<SMB服务状态>
  getStatus(): Promise<SMB服务状态>
  openAllFilesAccessSettings(): Promise<void>
  requestNotificationPermission(): Promise<void>
  getStorageRoots(): Promise<{ roots: SMB存储根[] }>
}

export let SMB服务器插件 = registerPlugin<SMB服务器原生插件>('SmbServer')
