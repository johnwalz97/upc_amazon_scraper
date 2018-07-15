module.exports = async (browser, data) => {
  const page = (await browser.pages())[0]
  await page.goto('https://www.amazon.com/')
  await page.click('#twotabsearchtextbox')
  await page.keyboard.type(data.upc)
  await Promise.all([page.click('#nav-search > form > div.nav-right > div > input'),page.waitForNavigation({waitUntil: 'networkidle0'})])

  data.asin = await page.evaluate(() => {return document.getElementById('result_0').getAttribute('data-asin')})
  data.link = 'https://www.amazon.com/dp/' + data.asin + '/'
  await page.goto(data.link)

  data = await page.evaluate((data) => {
    data.category = document.getElementById('wayfinding-breadcrumbs_feature_div').textContent.replace(/\s\s/g, '').trim()
    data.title = document.getElementById('title').textContent.replace(/\s\s/g, '').trim()
    data.price = document.getElementById('buybox').textContent.replace(/\s/g, '').match(/(\d+\.\d{1,2})/)[0]
    deets = document.getElementById('productDetailsTable')
    if (!deets) deets = document.getElementById('detailBullets')
    if (!deets) deets = document.getElementById('productDetails_detailBullets_sections1')
    if (deets) data.prodDetails = deets.textContent.replace(/\s\s/g, '')
    data.noOfReviews = document.getElementById('acrCustomerReviewText').textContent.match(/\d+/)[0]
    data.reviewsAverage = document.getElementById('acrPopover').getAttribute('title').substring(0, 3)
    return data
  }, data)

  return data
}
