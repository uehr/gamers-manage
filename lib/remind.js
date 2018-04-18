const date_format = "YYYY-MM-DD hh:mm:ss"
const moment = require("moment")
const settings = require("../settings.json")
const sleep = require("sleep-promise")
let reminds = []
moment.locale("ja")

const isExistsRemind = (title) => {
  return new Promise(resolve => {
    reminds.forEach(remind => {
      if (remind.title == title) resolve(true)
    })
    resolve(false)
  })
}

module.exports = {
  set: (msg, args) => {
    const set_title = args[1]
    const set_interval = args[2]
    const set_date = moment(args[2], "hh:mm")
    const now = moment()
    isExistsRemind(set_title).then(isExists => {
      if (!isExists)
        return new Promise(resolve => {
          resolve(set_interval <= 1440 && set_interval > 0)
        })
      else
        throw "is exists remind"
    }).then(isValid => {
      if (isValid) {
        msg.channel.send("リマインダーをセットしましたっ！").then(sended_msg => {
          msg.channel.send({
            embed: {
              color: 0x48f442,
              title: `[${now.add(set_interval, "m").format("hh:mm")}] ${set_title}`
            }
          })
        })
        reminds.push({ title: set_title, interval: set_interval, created_at: now })
        sleep(set_interval * 60000).then(sleeped => {
          reminds.forEach((remind, index) => {
            if (remind.title === set_title) reminds.splice(index, 1)
          })
          msg.channel.send({
            embed: {
              color: 0x48f442,
              title: set_title
            }
          })
        })
      } else
        throw "invalid interval"
    }).catch(error => {
      switch (error) {
        case "is exists remind":
          msg.channel.send("既存のリマインドです＞＜;")
          break;
        case "invalid interval":
          msg.channel.send("インターバルは1以上1440以下でなければなりません＞＜;")
          break;
        default:
          console.log(error)
          break;
      }
    })
  },
  list: (msg) => {
    reminds.forEach(remind => {
      msg.channel.send({
        embed: {
          color: 0x48f442,
          title: `[${moment(remind.created_at).add(remind.interval, "m").format("hh:mm")}] ${remind.title}`
        }
      })
    })
  }
}