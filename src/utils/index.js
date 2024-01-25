import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { BRACKET_MAP } from './constant.js'

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
// TODO: 获取上上层次目录路径，甚至更前的层次时，方法不兼容
export function getAbsolutePath(relativePath) {
  const currentPath = path.dirname(fileURLToPath(import.meta.url))
  // 因为这里的 currentPath 是 utils/ ，传入的相对路径是基于 src/ 的
  // 所以拼接会出问题，得返回上级目录，加个 '.' 即可
  return path.resolve(currentPath, '.' + relativePath)
}

// 写入文件内容（覆盖）
export async function setFileContent(filePath, content) {
  await fs.writeFileSync(getAbsolutePath(filePath), content)
}

// 读取文件返回内容
export async function getFileContent(filePath) {
  return await fs.readFileSync(getAbsolutePath(filePath), 'utf-8')
}
