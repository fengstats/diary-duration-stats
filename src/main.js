import NP from 'number-precision'
import clipboardy from 'clipboardy'
import { CLASS_MAP, EXTNAME_LIST, GENERATE_MONTH_HTML, RECORD_TITLE } from './utils/constant.js'
import {
  getFileContent,
  getFileName,
  getFilterFileList,
  getMinTime,
  getTimeDiff,
  isExistsFile,
  isFile,
  minuteToStrTime,
  minuteToTime,
  setFileContent,
  strTimeToMinute,
  tplFile,
  tplReplace,
} from './utils/index.js'

// 一些需要导入的文件路径
const CSS = await getFileContent('./style/index.css')
const appPath = './components/App.tpl'
const itemPath = './components/Item.tpl'
const moneyPath = './components/Money.tpl'
const emptyPath = './components/Empty.tpl'

const curDate = new Date()
const year = curDate.getFullYear()
const month = String(curDate.getMonth() + 1).padStart(2, '0')
let monthSpend = 0
let monthEarn = 0
// 是否允许写入文件
let allowWriteFile = true
let handlePath = `/Users/feng/codebase/private/diary/${year}/${month}月`
// let handlePath = './index.md'
let cssLabel = '<style>' + CSS + '</style>'
let html = cssLabel

setup()

// 开始咯！
async function setup() {
  // 用户传入的参数
  const input = process.argv.slice(2)
  // 传参优先级高于默认参数，直接覆盖
  input[0] && (handlePath = input[0])
  // 传入第二个参数代表不允许写入文件
  input[1] && (allowWriteFile = false)

  if (!checkParams(handlePath)) {
    console.log('❌ 无效文件参数，请检查')
  } else {
    // 基础样式
    console.log(cssLabel)
    if (isFile(handlePath)) {
      // 单文件处理
      run(handlePath)
    } else {
      // 目录处理
      for (const filePath of getFilterFileList(handlePath, EXTNAME_LIST)) {
        await run(filePath)
      }
    }
    // 生成月度统计 HTML
    if (GENERATE_MONTH_HTML) {
      setFileContent(`../${year}/${month}月.html`, html)
    }
  }
}

// RUN！！！
async function run(filePath) {
  const data = {
    earn: 0,
    spend: 0,
    fileTotalTime: 0,
    replaceList: [],
    showList: [],
    moneyList: [],
  }
  const fileName = getFileName(filePath)
  const text = await getFileContent(filePath)
  const oldTime = getOldFileTotalTime(text)

  // 睡眠
  calcSleepTime(data, text)

  // 二级标题下任务
  const lifeText = calcTitleTime(data, text)

  // 生活下的各种小记
  data.earn = calcMoney(data, '收入小记', lifeText)
  data.spend = calcMoney(data, '支出小记', lifeText)
  calcTotalTime(data)
  calcMonthMoney(data)

  if (checkNeedUpdate(oldTime, data.fileTotalTime)) {
    const replaceText = replaceRegexContent(data, text)
    await setFileContent(filePath, replaceText)
  }

  if (checkNeedPrint(oldTime, data.fileTotalTime)) {
    // NOTE: 涉及文件操作，需要 await 等待一下，不然全局数据就乱了
    await printStatsData(data, fileName)
    // 将 00:00 形式总时长写入系统剪贴板方便日记记录使用
    writeClipboard(minuteToTime(data.fileTotalTime))
  }
}

// 添加显示面板任务项
function addShowItem(data, title, statsTime) {
  data.showList.push({
    title,
    className: CLASS_MAP[title] || 'other',
    statsTime,
    strTime: minuteToStrTime(statsTime),
    percent: 0,
  })
}

// 添加金钱项
function addMoneyItem(data, title, emoji, money, monthMoney) {
  data.moneyList.push({
    title,
    className: CLASS_MAP[title] || 'other',
    emoji,
    money,
    monthMoney,
  })
}

// 计算睡眠时间
function calcSleepTime(data, text) {
  const title = '睡眠'
  const timeRegex = /(\d{2}):(\d{2})-(\d{2}):(\d{2})/g
  // 总的睡眠时长，因为可能有多个
  let sleepTime = 0
  let match = null
  while ((match = timeRegex.exec(text)) !== null) {
    const matchContent = match[0]
    const time = getMinTime(getTimeDiff(match[1], match[2], match[3], match[4]))
    const regex = `${matchContent}.*`
    const result = `${matchContent} 😴 ${minuteToStrTime(time, '**')}`
    sleepTime += time
    data.replaceList.push({ regex, result })
  }
  if (sleepTime) {
    data.fileTotalTime += sleepTime
    addShowItem(data, title, sleepTime)
  }
}

// 计算二级标题下任务列表时间
function calcTitleTime(data, text) {
  // 不同标题区域
  const titleAreaRegex = /## (.+?)\n([\s\S]*?)(?=\n## |\n*$)/g
  // 匹配出来每个任务
  const taskRegex = /- \[x\].*\*\*(.*)\*\*/g
  // 每个任务的时间
  const timeRegex = /\*\*(\d+h)?(\d+min)?\+?\*\*/
  // 生活标题匹配数据
  let lifeText = ''
  let match = null
  while ((match = titleAreaRegex.exec(text)) !== null) {
    const title = match[1]
    // 过滤掉 Record
    if (title === RECORD_TITLE) {
      continue
    }
    // 当前标题到下一个标题的内容
    const matchContent = match[2].trim()
    if (title === '生活') lifeText = matchContent
    let statsTime = 0
    // TODO: 这里别用错正则了，重新用了 titleAreaRegex 可能会导致死循环
    // 将所有任务列表匹配出来
    const taskList = matchContent.match(taskRegex) || []
    for (const task of taskList) {
      // 单个任务时长
      let taskTime = 0
      // NOTE: 再次匹配兼容单个任务多时长
      const multiTimeList = task.match(new RegExp(timeRegex, 'g')) || []
      for (const strTime of multiTimeList) {
        // strTime: **1h10min**
        taskTime += strTimeToMinute(strTime)
      }
      statsTime += taskTime
    }
    if (statsTime) {
      // 数据录入
      const regex = `- .*${title}：.*`
      const result = `- [x] ${title}：${minuteToStrTime(statsTime, '**')}`
      data.fileTotalTime += statsTime
      data.replaceList.push({ regex, result })
      addShowItem(data, title, statsTime)
    }
  }
  return lifeText
}

// 计算支出/收入/其他小记录入
function calcMoney(data, title, text) {
  const regex = new RegExp(`> ${title}：.*\n([\\s\\S]*?)(?=\n{2}|$)`)
  const moneyRegex = /-.*（(.*?) 元.*）/g
  let totalMoney = 0
  let match = null
  let matchMoney = null
  if ((match = regex.exec(text))) {
    const matchContent = match[1]
    const moneyList = []
    while ((matchMoney = moneyRegex.exec(matchContent)) !== null) {
      moneyList.push(matchMoney[1])
    }
    let result = `> ${title}：`
    if (moneyList.length) {
      // 如果有多个 money 小记，用 + 连接
      totalMoney = NP.plus(...moneyList)
      result += `${moneyList.join('+')}（${totalMoney} 元）`
    } else {
      result += '0 元'
    }
    // 数据录入
    data.replaceList.push({ regex: `> ${title}：.*`, result })
  }
  return parseInt(totalMoney)
}

// 计算文件总时长以及对应任务百分比
function calcTotalTime(data) {
  const title = '总时长'
  let totalTime = data.fileTotalTime
  for (const item of data.showList) {
    item.percent = Math.round((item.statsTime / totalTime) * 100)
  }
  const regex = `> ${title}：.*`
  const result = `> ${title}：${minuteToStrTime(totalTime, '**')}`
  data.replaceList.push({ regex, result })
}

// 计算月度支出/收入/其他小记
function calcMonthMoney(data) {
  monthEarn += data.earn
  monthSpend += data.spend
  addMoneyItem(data, '收入', '🎉', data.earn, monthEarn)
  addMoneyItem(data, '支出', '💢', data.spend, monthSpend)
}

// 打印数据统计面板
async function printStatsData(data, title = '日记时长统计') {
  // 基础样式
  let listHtml = ''
  let moneyHtml = ''
  // 列表数据模板替换
  for (const item of data.showList) {
    listHtml += await tplFile(itemPath, item)
  }
  for (const item of data.moneyList) {
    moneyHtml += await tplFile(moneyPath, item)
  }
  // 无统计时长数据展示
  if (data.showList.length === 0) {
    listHtml = await tplFile(emptyPath)
  }
  const appData = {
    title,
    time: minuteToTime(data.fileTotalTime),
    emoji: '⏳',
    listHtml,
    moneyHtml,
  }
  const appHtml = await tplFile(appPath, appData)
  html += appHtml
  // 输出当前文件处理的统计数据
  console.log(appHtml)
}

// 校验传入的文件参数是否有效
function checkParams(filePath) {
  if (!filePath || !isExistsFile(filePath)) {
    return false
  }
  return true
}

// 检查是否需要更新文件
function checkNeedUpdate(oldTime, newTime) {
  // 新旧总时长不一致 + 允许写入文件
  if (oldTime !== newTime && allowWriteFile) {
    return true
  }
  return false
}

// 检查是否需要输出统计面板
function checkNeedPrint(oldTime, newTime) {
  // 总时长在 24 小时内可以输出 or 在生成月度统计 HTML 时可以开启
  if (Math.min(oldTime, newTime) < 24 * 60 || GENERATE_MONTH_HTML) {
    return true
  }
  return false
}

// 获取旧文件总时长（单位：分钟）
function getOldFileTotalTime(text) {
  const totalRegex = /\n> 总时长：\*\*(\d+h)?(\d+min)?.*\*\*/
  const match = text.match(totalRegex)
  return parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0')
}

// 将数据通过正则替换到 Record 中
function replaceRegexContent(data, text) {
  for (const { regex: matchRegex, result } of data.replaceList) {
    if (matchRegex === '') continue
    const regex = new RegExp(matchRegex)
    text = text.replace(regex, result)
  }
  return text
}

// 写入剪切板
function writeClipboard(text) {
  text && clipboardy.write(text)
}

export {}
