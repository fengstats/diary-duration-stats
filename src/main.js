import { minToTimeStr, getFileContent } from './utils/index.js'

const inputPath = './index.md'

setup()

function addItem() {}

function run() {}

async function setup() {
  const content = await getFileContent(inputPath)
  console.log(content)
}

export {}
