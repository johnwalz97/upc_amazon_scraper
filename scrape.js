const browserPool = require('puppeteer-pool').createPuppeteerPool()
const csv = require('fast-csv')
const resultsFileStream = require("fs").createWriteStream('results.json')

const scrapeUpc = async (browser) => {
  const page = await browser.newPage()
  await page.goto('https://www.amazon.com/')
  await page.click('#twotabsearchtextbox')
  await page.keyboard.type(data.upc)
  await Promise.all([page.click('#nav-search > form > div.nav-right > div > input'),page.waitForNavigation({waitUntil: 'networkidle0'})])
  data.asin = await page.evaluate(() => {return document.getElementById('result_0').getAttribute('data-asin')})
  data.link = 'https://www.amazon.com/dp/' + data.asin + '/'
  await page.goto(data.link)
  data = await page.evaluate((data) => {
    var list = document.querySelectorAll('a.a-link-normal.a-color-tertiary')
    for (var i = 0; i < list.length; i++) {
      data.category += list[i].text.replace(/\s+/g,' ') + ' '
    }
    data.title = document.getElementById('productTitle').innerText
    data.price = document.querySelector('.a-size-medium.a-color-price.offer-price.a-text-normal').textContent
    data.weight = document.getElementById('productDetailsTable').innerHTML.substring(
      document.getElementById('productDetailsTable').innerHTML.indexOf('Shipping Weight:')+21,
      document.getElementById('productDetailsTable').innerHTML.indexOf(' pounds (')
    )
    data.ranking = document.getElementById('SalesRank').textContent.replace(/\s+/g,' ')
    data.noOfReviews = document.getElementById('acrCustomerReviewText').text
    data.reviewsAverage = document.getElementById('acrPopover').getAttribute('title')
    return data
  }, data)
  resultsFileStream.write(JSON.stringify(data))
  await page.close()
}

module.exports = (csvPath) => {
  let results = []
  csv
   .fromPath('my.csv')
   .on('data', data => {
     browserPool.use(scrapeUpc)
   })
}
