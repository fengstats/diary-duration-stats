import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { BRACKET_MAP } from './constant.js'

// 110 → 01:50
// `:` 可以通过传入第二个参数替换
export function minToTime(time, separator = ':') {
  const h = String(Math.floor(time / 60)).padStart(2, '0')
  const m = String(Math.floor(time % 60)).padStart(2, '0')
  return h + separator + m
}

// 110 → 01h50min
// 可以通过传入第二个参数添加括号
export function minToTimeStr(time, bracket = '') {
  if (time === 0) return ''
  const h = Math.floor(time / 60)
  const m = Math.floor(time % 60)
  const hStr = h === 0 ? '' : h + 'h'
  const mStr = m === 0 ? '' : String(m).padStart(2, '0') + 'min'
  return bracket + hStr + mStr + BRACKET_MAP[bracket]
}

// 相对路径 → 绝对路径
export function getAbsolutePath(relativePath) {
  const currentPath = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(currentPath, relativePath)
}

// 读取文件返回内容
export async function getFileContent(filePath) {
  return await fs.readFileSync(getAbsolutePath(filePath), 'utf-8')
}
