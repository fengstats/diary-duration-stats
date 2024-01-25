import { getFileContent, getMinTime, getTimeDiff, minToTimeStr, tplFile, tplReplace } from './utils/index.js'

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
function calcSleepTime(data, text, match = null) {
  // 总的睡眠时长，因为可能有多个
  let sleepTime = 0
  const regex = /.{1,}：(\d{2}):(\d{2})-(\d{2}):(\d{2})/g
  while ((match = regex.exec(text)) !== null) {
    const matchContent = match[0]
    console.log(matchContent)
    const statsTime = getMinTime(getTimeDiff(match[1], match[2], match[3], match[4]))
    sleepTime += statsTime
    data.replaceList.push({
      regex: `${matchContent}.*`,
      result: `${matchContent} 😴 ${minToTimeStr(statsTime, '**')}`,
    })
  }
  // 录入
  data.fileTotalTime += sleepTime
  data.showList.push({
    title: '睡眠',
    className: 'sleep',
    statsTime: sleepTime,
    strTime: minToTimeStr(sleepTime),
    percent: 0,
  })
}

calcSleepTime(data, text)

// 计算二级标题下任务列表时间录入
// 计算支出/收入/其他小记录入
// 输出数据统计面板
// 将数据通过正则替换到 Record 中

console.log(data)

export {}
