import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { 读取环境文件明文 } from '../setup/env-crypto-core.mjs'

let 项目根目录 = path.resolve(import.meta.dirname, '../..')
let 部署环境路径 = path.join(项目根目录, '.env/.env.deploy')
let GitHub环境文件 = z.string().min(1).parse(process.env['GITHUB_ENV'])
let 配置 = z
  .object({
    ANDROID_KEYSTORE_PATH: z.string().min(1),
    ANDROID_KEYSTORE_PASSWORD: z.string().min(1),
    ANDROID_KEY_ALIAS: z.string().min(1),
    ANDROID_KEY_PASSWORD: z.string().min(1),
  })
  .parse(dotenv.parse(读取环境文件明文(项目根目录, 部署环境路径)))
let 密钥库路径 = path.resolve(项目根目录, 配置.ANDROID_KEYSTORE_PATH)
if (fs.existsSync(密钥库路径) === false || fs.statSync(密钥库路径).isFile() === false) {
  throw new Error(`找不到 Android 签名密钥库: ${配置.ANDROID_KEYSTORE_PATH}`)
}
let 写入字段 = { ...配置, ANDROID_KEYSTORE_PATH: 密钥库路径 }
let 内容 = Object.entries(写入字段)
  .map(([名称, 值]): string => {
    let 分隔符 = `ANDROID_SIGNING_${crypto.randomUUID()}`
    return `${名称}<<${分隔符}\n${值}\n${分隔符}\n`
  })
  .join('')
fs.appendFileSync(GitHub环境文件, 内容, 'utf8')
console.log('Android 签名环境已准备完成')
