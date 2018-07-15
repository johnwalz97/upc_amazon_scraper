import {ipcRenderer, remote} from "electron"
const puppeteer = require('puppeteer')
const scrape = require('./scrape.js')
const csv = require('fast-csv')
const fs = require('fs')
const csvOutStream = csv.createWriteStream({headers: true})
const writableStream = fs.createWriteStream('results.csv')
csvOutStream.pipe(writableStream)

const queue = []
const browserPool = []
const poolMax = 4

const queueProcess = process => {
  if (browserPool.length > 0) {
    log("Processing " + process.upc + "...")
    const browser = browserPool.shift()
    scrape(browser, process).then(data => {
      csvOutStream.write(data)
      log("Finished getting data for " + data.upc)
      browserPool.push(browser)
      if (queue.length > 0) queueProcess(queue.shift())
      else if (browserPool.length == poolMax) quit()
    })
  } else {
    queue.push(process)
  }
}

const log = msg => ipcRenderer.send('progressPing', '- ' + msg + '\n')
const quit = () => {
  log("Saving results to file...")
  csvOutStream.end()
  log("Ending background jobs...")
  browserPool.forEach(browser => browser.close())
  log("Done")
  ipcRenderer.send('done')
  remote.getCurrentWindow().close()
}

(async () => {
  log("Starting background scraper jobs...")
  for (let i = 0; i < poolMax; i++) {
    browserPool[i] = await puppeteer.launch({args: ['--no-sandbox']})
    await browserPool[i].newPage()
  }
  log("Parsing UPCs from " + remote.getCurrentWindow().csvPath + "...")
  csv.fromPath(remote.getCurrentWindow().csvPath, {headers: true}).on('data', row => queueProcess({upc: row.upc}))
})()
