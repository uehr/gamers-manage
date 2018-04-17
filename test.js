const discord = require("discord.js")
const dclient = new discord.Client()
const settings = require("./settings.json")[0]
const moment = require("moment")
const dateFormat = "YYYY-MM-DD hh:mm:ss"
const sleep = require("sleep-promise")
let reminds = []

dclient.on("ready", () => {
  console.log("started: " + moment().format(dateFormat))
  vc = dclient.channels.find("name", "General")
})

const isExistsRemind = (title) => {
  return new Promise(resolve => {
    reminds.forEach(remind => {
      if(remind.title == title) resolve(true)
    })
    resolve(false)
  })
}

dclient.on("message", msg => {
  const remind = msg.content.match(/^!remind (\d{1,4}) (.+)/)
  switch(msg.content){
    case "!remind list":
      reminds.forEach(remind => {
        msg.channel.send({
          embed: {
            color: 0x48f442,
            title: `[${remind.created_at}] ${remind.title} ${remind.interval}分後`
          }
        })
      })
     break
  }
  if(remind){
    const set_interval = remind[1]
    const set_title = remind[2]
    const now = moment().format(dateFormat)
    isExistsRemind(set_title).then(isExists => {
      if(!isExists)
        return new Promise(resolve => {
          resolve(set_interval <= 1000 && set_interval > 0)
        })
      else
        throw "is exists remind"
    }).then(isValid => {
      if(isValid) {
        msg.channel.send("リマインダーをセットしましたっ！").then(sended_msg => {
          msg.channel.send({
            embed: {
              color: 0x48f442,
              title: `${set_title} ${set_interval}分後`
            }
          })
        })
        reminds.push({title: set_title, interval: set_interval, created_at: now})
        sleep(set_interval * 60000).then(sleeped => {
          reminds.forEach((remind, index) => {
            if(remind.title === set_title) reminds.splice(index, 1)
          })
          msg.channel.send("リマインダーをセットしましたっ！").then(sended_msg => {
            msg.channel.send({
              embed: {
                color: 0x48f442,
                title: `[remind] ${set_title}`
              }
            })
          })
        })
      }else
        throw "invalid interval"
    }).catch(error => {
      switch(error){
        case "is exists remind":
          msg.channel.send("既存のリマインドです＞＜;")
          break;
        case "invalid interval":
          msg.channel.send("インターバルは1以上1000以下でなければなりません＞＜;")
          break;
        default: 
          console.log(error)
          break;
      }
    })
  }
})

dclient.login(process.env.discord_token)