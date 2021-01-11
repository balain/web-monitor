const fetch = require('node-fetch')
const config = require('config')
const debug = require('debug')('index')
const cron = require('node-cron')
const fs = require('fs')
const nodemailer = require('nodemailer')

let transport = false
if (config.smtp && config.smtp.active) {
  transport = nodemailer.createTransport({
    host: config.smtp.server,
    port: config.smtp.port,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  })
}

cron.schedule('*/30 * * * *', () => {
  const stamp = Date.now()
  config.sites.forEach(async (site) => {
    try {
      debug(`Checking ${site}...`)
      const response = await fetch(site)
      let output = formatOutput(site, response.status, stamp)
      fs.writeFileSync(config.outputFileCumulative, output, { flag: "a+" })
      debug(`...done: ${response.status}`)
    } catch (error) {
      let output = formatOutput(site, '???', stamp, error.message)
      fs.writeFileSync(config.outputFileCumulative, output, { flag: "a+" })
      if (transport) {
        try {
          const mailResponse = await transport.sendMail({ from: config.smtp.from, to: config.smtp.to, subject: config.smtp.subject, text: output })
          debug(`mailResponse: ${mailResponse}`)
        } catch (error) {
          console.error(`Error sending email: ${error}`)
        }
      }
      debug(`...done with ERROR: ${error}`)
    }
  })
})

function formatOutput(site, code, timestamp, msg = false) {
  return(`${timestamp}\t${code}\t${site}${msg ? `\t${msg}` : ''}\n`)
}
