const discord = require("discord.js")
const dclient = new discord.Client()
const settings = require("./settings.json")[0]
const moment = require("moment")
const dateFormat = "YYYY-MM-DD hh:mm:ss"
const sleep = require("sleep-promise")

dclient.on("ready", () => {
  console.log("started: " + moment().format(dateFormat))
  vc = dclient.channels.find("name", "General")
})

dclient.on("message", msg => {
  const ctrl_cmd = msg.content.match(/^!msg (.+) (.+)$/)
  if(ctrl_cmd && msg.author.id === settings.developer_id){
    const args = msg.content.replace("!msg ", "").split(" ")
    const channel_name = args[0]
    args.shift()
    const message = args.join(" ")
    const channel = dclient.channels.find("name", channel_name)
    if(channel) {
      channel.send(message)
    }else{
      msg.channel.send("チャンネルが取得出来ません ＞＜;")
    }
  }
})

dclient.login(process.env.discord_token)