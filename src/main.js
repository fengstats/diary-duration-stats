import { getFileContent, tplFile, tplReplace } from './utils/index.js'

// 基础样式
const style = await getFileContent('./components/Style.tpl')
let html = style

export {}
