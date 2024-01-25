import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { BRACKET_MAP } from './constant.js'

// 110 → 01:50
// `:` 可以通过传入第二个参数替换
export function minuteToTime(time, separator = ':') {
  if (time === 0) return ''
  const h = String(Math.floor(time / 60)).padStart(2, '0')
  const m = String(Math.floor(time % 60)).padStart(2, '0')
  return h + separator + m
}

// 110 → 1h50min
// 传入第二个参数给返回数据添加对应括号
export function minuteToStrTime(time, bracket = '') {
  if (time === 0) return ''
  const h = Math.floor(time / 60)
  const m = Math.floor(time % 60)
  const hStr = h === 0 ? '' : h + 'h'
  const mStr = m === 0 ? '' : String(m).padStart(2, '0') + 'min'
  return bracket + hStr + mStr + BRACKET_MAP[bracket]
}

// 1h → 60
// 50min → 50
// 1h50min → 110
// **1h** → 60
// **50min** → 50
// **1h50min** → 110
export function strTimeToMinute(strTime) {
  // 去除可能存在的星号
  const cleanInput = strTime.replace(/\*/g, '')

  // 匹配小时和分钟
  const timeRegex = /(?:(\d+)h)?(?:(\d+)min)?/
  const match = cleanInput.match(timeRegex)

  // 如果匹配成功，提取小时和分钟
  if (match) {
    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    // 转换为分钟返回
    return hours * 60 + minutes
  } else {
    // 如果没有匹配到时间格式，返回null或其他错误处理
    return 0
  }
}

// 直接读取 tpl 文件替换内容返回
export async function tplFile(filePath, data = {}) {
  return tplReplace(await getFileContent(filePath), data)
}

// 模板替换：替换 {{}} Mustache 语法变量内容
export function tplReplace(str, data) {
  for (const [key, value] of Object.entries(data)) {
    str = str.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return str
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

// 校验是否是一个文件
export function isFile(filePath) {
  return fs.statSync(getAbsolutePath(filePath)).isFile()
}

// 校验文件是否存在
export function isExistsFile(filePath) {
  return fs.existsSync(getAbsolutePath(filePath))
}

// 获取过滤后的文件列表
// NOTE: 目前只处理文件
export function getFilterFileList(dirPath, extnameList = ['.md']) {
  return fs
    .readdirSync(getAbsolutePath(dirPath))
    .filter((file) => extnameList.includes(path.extname(file)) && isFile(path.join(dirPath, file)))
    .map((file) => path.join(dirPath, file))
}

// 获取文件名称
export function getFileName(filePath) {
  return path.parse(filePath).name
}

// 相对路径 → 绝对路径
// NOTE: 注意这里的处理，文件相当路径是基于 src/ 目录的
export function getAbsolutePath(filePath) {
  // 如果已经是绝对路径，直接返回
  if (path.isAbsolute(filePath)) {
    return filePath
  }

  // 获取当前文件的绝对路径
  const currentFilePath = fileURLToPath(import.meta.url)
  // 获取当前文件所在目录的路径
  const currentDirPath = path.dirname(currentFilePath)
  // 获取 src 目录的绝对路径，即当前目录向上一层
  const srcDirPath = path.join(currentDirPath, '../')
  // 解析相对于 src 目录的绝对路径
  return path.resolve(srcDirPath, filePath)
}

// 读取文件返回内容
export async function getFileContent(filePath) {
  return await fs.readFileSync(getAbsolutePath(filePath), 'utf-8')
}

// 写入文件内容（覆盖）
export async function setFileContent(filePath, content) {
  const absolutePath = getAbsolutePath(filePath)
  // 如果目录不存在，递归创建
  const dirPath = path.dirname(absolutePath)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  await fs.writeFileSync(absolutePath, content)
}
