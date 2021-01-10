const fetch = require('node-fetch')
const config = require('config')
const debug = require('debug')('index')
const cron = require('node-cron')
const fs = require('fs')

cron.schedule('* */5 * * * *', () => {
  const stamp = Date.now()
  config.sites.forEach(async (site) => {
    try {
      const response = await fetch(site)
      let output = formatOutput(site, response.status, stamp)
      fs.writeFileSync(config.outputFileCumulative, output, { flag: "a+" })
    } catch (error) {
      let output = formatOutput(site, response.status, stamp, error.message)
      fs.writeFileSync(config.outputFileCumulative, output, { flag: "a+" })
    }
  })
})

function formatOutput(site, code, timestamp, msg = false) {
  return(`${timestamp}\t${code}\t${site}${msg ? `\t${msg}` : ''}\n`)
}