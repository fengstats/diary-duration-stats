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

const data = {
  monthSpend: 0,
  monthEarn: 0,
  fileTotalTime: 0,
  replaceList: [],
  showList: [],
}

// 基础样式
const style = await getFileContent('./components/Style.tpl')
let html = style

let text = await getFileContent('./index.md')

// 计算睡眠时间并录入
function calcSleepTime(data, text, match = null, title = '睡眠') {
  // 总的睡眠时长，因为可能有多个
  let sleepTime = 0
  const regex = /.{1,}：(\d{2}):(\d{2})-(\d{2}):(\d{2})/g
  while ((match = regex.exec(text)) !== null) {
    const matchContent = match[0]
    const time = getMinTime(getTimeDiff(match[1], match[2], match[3], match[4]))
    sleepTime += time
    data.replaceList.push({
      regex: `${matchContent}.*`,
      result: `${matchContent} 😴 ${minuteToStrTime(time, '**')}`,
    })
  }
  // 录入
  data.fileTotalTime += sleepTime
  data.showList.push({
    title,
    className: CLASS_MAP[title],
    statsTime: sleepTime,
    strTime: minuteToStrTime(sleepTime),
    percent: 0,
  })
}

// 计算二级标题下任务列表时间并录入
function calcTitleTime(data, text, match = null) {
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
    data.fileTotalTime += statsTime
    data.replaceList.push({
      regex: `- [x] ${title}：.*`,
      result: `- [x] ${title}：${minuteToStrTime(statsTime, '**')}`,
    })
    data.showList.push({
      title,
      className: CLASS_MAP[title],
      statsTime,
      strTime: minuteToStrTime(statsTime),
      percent: 0,
    })
  }
}

// 计算支出/收入/其他小记录入
// 输出数据统计面板
// 将数据通过正则替换到 Record 中

calcSleepTime(data, text)
calcTitleTime(data, text)
console.log(data)

export {}
