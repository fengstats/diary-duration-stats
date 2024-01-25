import NP from 'number-precision'
import { CLASS_MAP, RECORD_TITLE } from './utils/constant.js'
import {
  getFileContent,
  getMinTime,
  getTimeDiff,
  minuteToStrTime,
  strTimeToMinute,
  tplFile,
  tplReplace,
} from './utils/index.js'

let monthSpend = 0
let monthEarn = 0

const data = {
  spend: 0,
  earn: 0,
  fileTotalTime: 0,
  replaceList: [],
  showList: [],
}

// 基础样式
const style = await getFileContent('./components/Style.tpl')
let html = style
let text = await getFileContent('./index.md')

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
    className: CLASS_MAP[title],
    statsTime,
    strTime: minuteToStrTime(statsTime),
    percent: 0,
  })
}

// 计算睡眠时间并录入
function calcSleepTime(title = '睡眠', text, match = null) {
  // 总的睡眠时长，因为可能有多个
  let sleepTime = 0
  const regex = /.{1,}：(\d{2}):(\d{2})-(\d{2}):(\d{2})/g
  while ((match = regex.exec(text)) !== null) {
    const matchContent = match[0]
    const time = getMinTime(getTimeDiff(match[1], match[2], match[3], match[4]))
    sleepTime += time
    addReplaceItem(`${matchContent}.*`, `${matchContent} 😴 ${minuteToStrTime(time, '**')}`)
  }
  // 录入
  addFileTotalTime(sleepTime)
  addShowItem(title, sleepTime, minuteToStrTime(sleepTime))
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
    addReplaceItem(`- [x] ${title}：.*`, `- [x] ${title}：${minuteToStrTime(statsTime, '**')}`)
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
    let result = `${title}：`
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
}

// 输出数据统计面板
// 将数据通过正则替换到 Record 中

calcSleepTime('睡眠', text)
calcTitleTime(text)
calcTotalTime('总时长')
calcMonthMoney()
console.log(monthEarn)
console.log(monthSpend)
console.log(data)

export {}
