import NP from 'number-precision'
import clipboardy from 'clipboardy'
import {
  CLASS_MAP,
  EXTNAME_LIST,
  ALLOW_GENERATE_HTML,
  RECORD_TITLE,
  GENERATE_DATE_LIST,
  ALLOW_FOOTER,
} from './utils/constant.js'
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
  moneyFormat,
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
const footerPath = './components/Footer.tpl'
const emptyPath = './components/Empty.tpl'

const curDate = new Date()
const year = curDate.getFullYear()
const month = String(curDate.getMonth() + 1).padStart(2, '0')
let monthSpend = 0
let monthEarn = 0
// 临时默认
let isTmpMode = false
// 是否允许写入文件
let allowWriteFile = true
let handlePath = `/Users/feng/codebase/private/diary/${year}/${month}月`
// let handlePath = './index.md'
let cssLabel = '<style>' + CSS + '</style>'
// let html = cssLabel
let html = ''

setup()

// 开始咯！
async function setup() {
  // 用户传入的参数
  const input = process.argv.slice(2)
  // 传参优先级高于默认参数，直接覆盖
  input[0] && (handlePath = input[0])
  // 传入第二个参数代表临时模式且不允许写入文件
  if (input[1]) {
    isTmpMode = true
    allowWriteFile = false
  }
  if (!checkParams(handlePath)) {
    console.log('❌ 无效文件参数，请检查')
    return null
  }

  // 添加基础样式
  console.log(cssLabel)
  if (isFile(handlePath)) {
    // 单文件处理
    await run(handlePath)
  } else {
    // 目录处理
    for (const filePath of getFilterFileList(handlePath, EXTNAME_LIST)) {
      if (await run(filePath)) break
    }
  }
  generateHtmlStats()
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

  // TODO: 比对金钱小记是否发生改变，如果发生改变也需要更新文件
  if (checkNeedUpdate(oldTime, data.fileTotalTime)) {
    const replaceText = replaceRegexContent(data, text)
    await setFileContent(filePath, replaceText)
  }

  if (checkNeedPrint(oldTime, data.fileTotalTime, fileName)) {
    // NOTE: 涉及文件操作，需要 await 等待一下，不然全局数据就乱了
    await printStatsData(data, fileName)
    // NOTE: 返回 true 来控制是否停止后续执行
    // return true
  }
  return false
}

// 添加显示面板任务项
function addShowItem(data, title, statsTime) {
  data.showList.push({
    title,
    className: CLASS_MAP[title] || 'other',
    statsTime,
    strTime: minuteToStrTime(statsTime),
    percent: 0,
    // NOTE: 兼容临时模式，注意这里类名后是故意留的空格
    // 因为 tpl 是这么写的：{{tmpClass}}i-title
    tmpClass: isTmpMode ? 'i-title-tmp ' : '',
  })
}

// 添加金钱项
function addMoneyItem(data, title, emoji, money, monthMoney) {
  data.moneyList.push({
    title,
    className: CLASS_MAP[title] || 'other',
    emoji,
    money: moneyFormat(money),
    monthMoney: moneyFormat(monthMoney),
  })
}

// 计算睡眠时间
function calcSleepTime(data, text) {
  const timeRegex = /- \[x\] (.*)：((\d{2}):(\d{2})-(\d{2}):(\d{2}))/g
  // 总的睡眠时长，因为可能有多个
  let sleepTime = 0
  let match = null
  while ((match = timeRegex.exec(text)) !== null) {
    const title = match[1]
    // 00:00-06:00
    const timeContent = match[2]
    const time = getMinTime(getTimeDiff(match[3], match[4], match[5], match[6]))
    const regex = `- \\[x\\] ${title}：${timeContent}.*`
    const result = `- [x] ${title}：${timeContent} 😴 ${minuteToStrTime(time, '**')}`
    sleepTime += time
    data.replaceList.push({ regex, result })
  }
  if (sleepTime) {
    data.fileTotalTime += sleepTime
    addShowItem(data, '睡眠', sleepTime)
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
  return totalMoney
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
  monthEarn = NP.plus(monthEarn, data.earn)
  monthSpend = NP.plus(monthSpend, data.spend)
  addMoneyItem(data, '收入', '🎉', data.earn, monthEarn)
  addMoneyItem(data, '支出', '💢', data.spend, monthSpend)
}

// 打印数据统计面板
async function printStatsData(data, title) {
  const { fileTotalTime, moneyList, showList } = data
  // 基础样式
  let listHtml = ''
  let moneyHtml = ''
  // 无统计时长数据展示
  if (showList.length === 0) {
    listHtml = await tplFile(emptyPath)
  }
  // 列表数据模板替换
  for (const item of showList) {
    listHtml += await tplFile(itemPath, item)
  }
  for (const item of moneyList) {
    // item.money = 0
    // item.monthMoney = 0
    moneyHtml += await tplFile(moneyPath, item)
  }

  const appData = {
    title,
    time: minuteToTime(fileTotalTime),
    emoji: '⏳',
    listHtml,
    footerHtml: '',
  }

  // 允许生成 footer
  if (ALLOW_FOOTER && !isTmpMode && !ALLOW_GENERATE_HTML) {
    appData.footerHtml = await tplFile(footerPath, { moneyHtml })
  }

  // NOTE: 临时模式
  if (isTmpMode) {
    appData.title = '总时长'
    appData.time = minuteToStrTime(fileTotalTime)
  }

  const appHtml = await tplFile(appPath, appData)
  html += appHtml

  // 输出当前文件处理的统计数据
  console.log(appHtml)

  // 将 00:00 形式总时长写入系统剪贴板方便日记记录使用
  writeClipboard(appData.time >= '24:00' ? '00:00' : appData.time)
}

// 生成 HTML 面板文件
function generateHtmlStats() {
  if (ALLOW_GENERATE_HTML) {
    let htmlFileName = `${month}月`
    if (GENERATE_DATE_LIST.length) {
      htmlFileName = `${GENERATE_DATE_LIST[0]} 至 ${
        GENERATE_DATE_LIST[GENERATE_DATE_LIST.length - 1]
      }`
    }
    // TODO: 加自定义样式
    html = `<link rel="stylesheet" href="./index.css" /><body id="app-list">` + html + '</body>'
    setFileContent(`../${year}/${htmlFileName}.html`, html)
  }
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
function checkNeedPrint(oldTime, newTime, fileName) {
  // 允许生成 HTML
  if (ALLOW_GENERATE_HTML) {
    const fileDate = fileName.split(' ')[0]
    if (GENERATE_DATE_LIST.length === 0) {
      // 生成月度统计，一律不校验
      return true
    } else if (GENERATE_DATE_LIST.includes(fileName.split(' ')[0])) {
      // 设置了生成日期列表，校验日期是否符合要求
      return true
    }
    // 不符合生成日期列表的就过滤掉了
    return false
  }

  // 总时长在 24 小时内
  if (Math.min(oldTime, newTime) < 24 * 60) {
    return true
  }

  // 都不满足条件
  return false
}

// 获取旧文件总时长（单位：分钟）
function getOldFileTotalTime(text) {
  const totalRegex = /\n> 总时长：\*\*(\d+h)?(\d+min)?.*\*\*/
  const match = text.match(totalRegex)
  if (match) {
    return parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0')
  }
  return 0
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
