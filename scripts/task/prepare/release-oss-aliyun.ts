import inquirer from 'inquirer'
import type { 任务准备上下文, 任务准备结果 } from '../model/task-runner'

export async function 准备OSS发布参数(上下文: 任务准备上下文): Promise<任务准备结果> {
  let 仅构建 = 上下文.参数.some((参数): boolean => 参数.startsWith('--build-only='))
  if (仅构建 === true) return { 参数: 上下文.参数 }
  let 自动确认 = 上下文.参数.includes('--yes') === true || 上下文.参数.includes('-y') === true
  let 保留参数 = 上下文.参数.filter((参数): boolean => 参数 !== '--yes' && 参数 !== '-y' && 参数 !== '--confirmed')
  if (自动确认 === false) {
    if (process.stdin.isTTY !== true || process.stdout.isTTY !== true) {
      throw new Error('非交互环境执行 OSS 同步必须显式传入 --yes')
    }
    let 回答 = await inquirer.prompt<{ 确认同步: boolean }>([
      {
        type: 'confirm',
        name: '确认同步',
        message: '是否构建纯前端页面、比较云端差异并执行必要的上传和删除？',
        default: false,
      },
    ])
    if (回答.确认同步 === false) throw new Error('已取消 OSS 同步')
  }
  return { 参数: [...保留参数, '--confirmed'] }
}
