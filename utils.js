// 括号匹配
const bracketMap = {
  '': '',
  '**': '**',
  '(': ')',
  '（': '）',
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
function minToTimeStr(time, bracket = '') {
  if (time === 0) return ''
  const h = Math.floor(time / 60)
  const m = Math.floor(time % 60)
  const hStr = h === 0 ? '' : h + 'h'
  const mStr = m === 0 ? '' : String(m).padStart(2, '0') + 'min'
  return bracket + hStr + mStr + bracketMap[bracket]
}
