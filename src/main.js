import { getFileContent, tplReplace } from './utils/index.js'

let html = ''
html += await getFileContent('./components/Style.tpl')
html += await getFileContent('./components/App.tpl')

const data = {
  title: '日记时长统计',
  time: '00:00',
  emoji: '⏳',
  listHtml: '<h2>你好</h2>',
  moneyHtml: '<h2>世界</h2>',
}

console.log(tplReplace(html, data))

export {}
