// 记录标题
export const RECORD_TITLE = 'Record'
// 左右括号匹配
export const BRACKET_MAP = {
  '': '',
  '**': '**',
  '(': ')',
  '（': '）',
}
export const CLASS_MAP = {
  睡眠: 'sleep',
  生活: 'life',
  休闲: 'leisure',
  支出: 'life',
  重要: 'important',
  收入: 'important',
}

// 月消费
const monthSpend = 0
// 月支出
const monthEarn = 0
// data 结构设计
const data = {
  // 今日支出
  spend: 0,
  // 今日收入
  earn: 0,
  // 当前文件总时长
  fileTotalTime: 200,
  // 这里面的数据会根据正则匹配做替换
  replaceList: [
    {
      regex: '00:00-06:00.*',
      result: '00:00-06:00 💤 **6h**',
    },
    {
      regex: '重要：.*',
      result: '重要：**50min**',
    },
    {
      regex: '支出小记：.*',
      result: '支出小记：9+13（22 元）',
    },
    {
      regex: '收入小记：.*',
      result: '收入小记：9+13（22 元）',
    },
    {
      regex: '> 总时长：.*',
      result: '> 总时长：**1h10min**',
    },
  ],
  // 展示面板列表
  showList: [
    {
      // id: 1,
      title: '睡眠/重要/生活/休闲',
      className: 'sleep/important/life/leisure', // 类样式
      statsTime: 70, // 分钟单位
      strTime: '1h10min', // 字符串形式
      // NOTE: 这个值需要有总时长之后再计算（动态）
      percent: 10,
    },
  ],
  moneyList: [
    {
      title: '收入/支出/其他',
      className: 'important/leisure',
      emoji: '🎉/💢',
      money: '18',
      monthMoney: '18',
    },
  ],
}

// App.tpl 替换数据
const AppData = {
  title: '日记时长统计',
  time: '00:00',
  emoji: '⏳',
  listHtml: '<h2>你好</h2>',
  moneyHtml: '<h2>世界</h2>',
}
