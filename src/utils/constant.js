// data 结构设计
const data = {
  // 月消费
  monthSpend: 0,
  // 月支出
  monthEarn: 0,
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
  ],
  // 展示面板列表
  showList: [
    {
      id: 1,
      name: '睡眠/重要/生活/休闲',
      statsTime: 70, // 分钟
      strTime: '1h10min', // 字符串
    },
  ],
}

// 是否写入文件
export const IS_WRITE_FILE = true
// 记录标题
export const RECORD_TITLE = 'Record'
// 左右括号匹配
export const BRACKET_MAP = {
  '': '',
  '**': '**',
  '(': ')',
  '（': '）',
}
