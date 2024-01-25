import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { BRACKET_MAP } from './constant.js'

// 直接读取 tpl 文件替换内容返回
export async function tplFile(filePath, data) {
  return tplReplace(await getFileContent(filePath), data)
}

// 模板替换：替换 {{}} Mustache 语法变量内容
export function tplReplace(str, data) {
  for (const [key, value] of Object.entries(data)) {
    str = str.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return str
}

// 110 → 01:50
// `:` 可以通过传入第二个参数替换
export function minToTime(time, separator = ':') {
  const h = String(Math.floor(time / 60)).padStart(2, '0')
  const m = String(Math.floor(time % 60)).padStart(2, '0')
  return h + separator + m
}

// 110 → 01h50min
// 传入第二个参数给返回数据添加对应括号
export function minToTimeStr(time, bracket = '') {
  if (time === 0) return ''
  const h = Math.floor(time / 60)
  const m = Math.floor(time % 60)
  const hStr = h === 0 ? '' : h + 'h'
  const mStr = m === 0 ? '' : String(m).padStart(2, '0') + 'min'
  return bracket + hStr + mStr + BRACKET_MAP[bracket]
}

// 相对路径 → 绝对路径
// TODO: 获取上上层次目录路径，甚至更前的层次时，方法不兼容
export function getAbsolutePath(relativePath) {
  const currentPath = path.dirname(fileURLToPath(import.meta.url))
  // 因为这里的 currentPath 是 utils/ ，传入的相对路径是基于 src/ 的
  // 所以拼接会出问题，得返回上级目录，加个 '.' 即可
  return path.resolve(currentPath, '.' + relativePath)
}

// 传入起始时间和结束时间对应的小时和分钟，计算其时间差
// 返回单位为毫秒
export function getTimeDiff(startHour, startMin, endHour, endMin) {
  // 以当前时间做对比
  const start = new Date()
  const end = new Date()
  // 设置
  start.setHours(parseInt(startHour), parseInt(startMin), 0, 0)
  end.setHours(parseInt(endHour), parseInt(endMin), 0, 0)
  // 如果结束时间比起始时间小，那就是跨天了，将结束时间 +1 天
  if (end < start) {
    end.setDate(end.getDate() + 1)
  }
  return end.getTime() - start.getTime()
}

// 将毫秒转换为分钟单位
export function getMinTime(ms) {
  return Math.floor(ms / 1000 / 60)
}

// 读取文件返回内容
export async function getFileContent(filePath) {
  return await fs.readFileSync(getAbsolutePath(filePath), 'utf-8')
}

// 写入文件内容（覆盖）
export async function setFileContent(filePath, content) {
  await fs.writeFileSync(getAbsolutePath(filePath), content)
}
