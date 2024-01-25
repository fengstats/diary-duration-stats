import NP from 'number-precision'
import clipboardy from 'clipboardy'
import { CLASS_MAP, EXTNAME_LIST, RECORD_TITLE } from './utils/constant.js'
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

const data = {}
const curDate = new Date()
const year = curDate.getFullYear()
const month = String(curDate.getMonth() + 1).padStart(2, '0')
let monthSpend = 0
let monthEarn = 0
// 是否写入文件
let isWriteFile = true
// let handlePath = `/Users/feng/codebase/private/diary/${year}/${month}月`
let handlePath = './01月'
// NOTE: 基础样式只导入一次
let html = '<style>' + (await getFileContent('./components/index.css')) + '</style>'

setup()

async function setup() {
  // 用户传入的参数
  const input = process.argv.slice(2)
  // 优先级高于默认参数直接覆盖
  input[0] && (handlePath = input[0])
  // 传入第二个参数代表不需要写入文件
  input[1] && (isWriteFile = false)

  if (!checkParams(handlePath)) {
    console.log('❌ 无效的文件参数')
  } else {
    if (isFile(handlePath)) {
      // 文件处理
      run(handlePath)
    } else {
      // 目录处理
      for (const filePath of getFilterFileList(handlePath, EXTNAME_LIST)) {
        await run(filePath)
      }
    }
    // 最后输出
    console.log(html)
  }
}

// RUN！！！
async function run(filePath) {
  // TODO: 把全局 data 换成局部 data
  initData()
  let text = await getFileContent(filePath)
  calcSleepTime('睡眠', text)
  calcTitleTime(text)
  calcTotalTime('总时长')
  calcMonthMoney()
  // NOTE: 涉及文件操作，需要 await 等待一下，不然全局数据就乱了
  await outputStats(getFileName(filePath))
  await saveFile(filePath, text)
  // 将 00:00 形式总时长写入系统剪贴板方便日记记录使用
  clipboardy.write(minuteToTime(data.fileTotalTime))
}

// 初始化全局数据
function initData() {
  data.earn = 0
  data.spend = 0
  data.fileTotalTime = 0
  data.replaceList = []
  data.showList = []
  data.moneyList = []
}

// 添加文件总时长
function addFileTotalTime(time) {
  data.fileTotalTime += time
}

// 添加正则替换列表项
function addReplaceItem(regex, result) {
  data.replaceList.push({
    regex,
    result,
  })
}

// 添加显示面板任务项
function addShowItem(title, statsTime, strTime) {
  data.showList.push({
    title,
    className: CLASS_MAP[title] || 'other',
    statsTime,
    strTime: minuteToStrTime(statsTime),
    percent: 0,
  })
}

// 添加金钱项
function addMoneyItem(title, emoji, money, monthMoney) {
  data.moneyList.push({
    title,
    className: CLASS_MAP[title] || 'other',
    emoji,
    money,
    monthMoney,
  })
}

// 计算睡眠时间并录入
function calcSleepTime(title = '睡眠', text, match = null) {
  // 总的睡眠时长，因为可能有多个
  let sleepTime = 0
  const regex = /(\d{2}):(\d{2})-(\d{2}):(\d{2})/g
  while ((match = regex.exec(text)) !== null) {
    const matchContent = match[0]
    const time = getMinTime(getTimeDiff(match[1], match[2], match[3], match[4]))
    sleepTime += time
    addReplaceItem(`${matchContent}.*`, `${matchContent} 😴 ${minuteToStrTime(time, '**')}`)
  }
  if (sleepTime) {
    // 录入
    addFileTotalTime(sleepTime)
    addShowItem(title, sleepTime, minuteToStrTime(sleepTime))
  }
}

// 计算二级标题下任务列表时间并录入
function calcTitleTime(text, match = null) {
  // 不同标题区域
  const titleAreaRegex = /## (.+?)\n([\s\S]*?)(?=\n## |\n*$)/g
  // 匹配出来每个任务
  const taskRegex = /- \[x\].*\*\*(.*)\*\*/g
  // 每个任务的时间
  const timeRegex = /\*\*(\d+h)?(\d+min)?\+?\*\*/
  while ((match = titleAreaRegex.exec(text)) !== null) {
    const title = match[1]
    // 过滤掉 Record
    if (title === RECORD_TITLE) {
      continue
    }
    // 当前标题到下一个标题的内容
    const matchContent = match[2].trim()
    if (title === '生活') {
      // 生活下会记录各种小记
      data.earn = calcMoney('收入小记', matchContent)
      data.spend = calcMoney('支出小记', matchContent)
    }

    // TODO: 这里别用错正则了，重新用了 titleAreaRegex 可能会导致死循环
    // 将所有任务列表匹配出来
    const taskList = matchContent.match(taskRegex) || []

    let statsTime = 0
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

    // 录入
    addFileTotalTime(statsTime)
    addReplaceItem(`- .*${title}：.*`, `- [x] ${title}：${minuteToStrTime(statsTime, '**')}`)
    addShowItem(title, statsTime, minuteToStrTime(statsTime))
  }
}

// 计算文件总时长以及对应任务百分比
function calcTotalTime(title) {
  let totalTime = data.fileTotalTime
  for (const item of data.showList) {
    item.percent = Math.round((item.statsTime / totalTime) * 100)
  }
  addReplaceItem(`> ${title}：.*`, `> ${title}：${minuteToStrTime(totalTime, '**')}`)
}

// 计算支出/收入/其他小记录入
function calcMoney(title, text, match = null, matchMoney = null) {
  let totalMoney = 0
  const regex = new RegExp(`> ${title}：.*\n([\\s\\S]*?)(?=\n{2}|$)`)
  const moneyRegex = /-.*（(.*?) 元.*）/g

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
    addReplaceItem(`> ${title}：.*`, result)
  }
  return parseInt(totalMoney)
}

// 计算月度支出/收入/其他小记
function calcMonthMoney() {
  monthEarn += data.earn
  monthSpend += data.spend

  addMoneyItem('收入', '🎉', data.earn, monthEarn)
  addMoneyItem('支出', '💢', data.spend, monthSpend)
}

// 输出数据统计面板
async function outputStats(title = '日记时长统计') {
  // 基础样式
  let listHtml = ''
  let moneyHtml = ''
  // 列表数据模板替换
  for (const item of data.showList) {
    listHtml += await tplFile('./components/Item.tpl', item)
  }
  for (const item of data.moneyList) {
    moneyHtml += await tplFile('./components/Money.tpl', item)
  }
  // 无统计时长数据展示
  if (data.showList.length === 0) {
    listHtml = await tplFile('./components/Empty.tpl')
  }
  const AppData = {
    title,
    time: minuteToTime(data.fileTotalTime),
    emoji: '⏳',
    listHtml,
    moneyHtml,
  }
  html += await tplFile('./components/App.tpl', AppData)
}

// 校验传入的文件参数是否有效
function checkParams(filePath) {
  if (!filePath || !isExistsFile(filePath)) {
    return false
  }
  return true
}

// 将数据通过正则替换到 Record 中
function replaceRegexContent(text) {
  for (const { regex: matchRegex, result } of data.replaceList) {
    if (matchRegex === '') continue
    const regex = new RegExp(matchRegex)
    text = text.replace(regex, result)
  }
  return text
}

// 保存文件写入替换的数据
async function saveFile(filePath, text) {
  if (isWriteFile) {
    await setFileContent(filePath, replaceRegexContent(text))
  }
}

export {}
