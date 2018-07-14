/**
 * [using envs list]
 * twitter_consumer_key
 * twitter_consumer_secret
 * twitter_access_token_key
 * twitter_access_token_secret
 * discord_token
*/

const discord = require("discord.js")
const dclient = new discord.Client()
const settings = require("./settings.json")
const moment = require("moment")
const cron = require("cron").CronJob
const http = require("http")
const vote = require("./lib/vote")
const remind = require("./lib/remind")
const r6s = require("./lib/r6s")
const memberRecruit = require("./lib/membersRecruit")

//app running check for heroku
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text:plain" })
  res.end(process.env.app_status)
}).listen(process.env.PORT || 8080)

dclient.on("ready", () => {
  console.log("started: " + moment().format(settings.date_format))
})

dclient.on("guildMemberAdd", member => {
  const name = member.user.username
  const user_status = settings.join_random_msg[Math.floor(Math.random() * settings.join_random_msg.length)]
  dclient.channels.find("name", settings.welcome_msg_channel_name).send(settings.join_msg.replace("<name>", name).replace("<status>", user_status))
})

memberRecruit.register(dclient)

dclient.on("message", msg => {
  switch (msg.content) {
    case "!help":
      require("./lib/help")(msg)
      break;
    case "!now":
      msg.channel.send(moment().format(settings.date_format))
      break;
    case "!info":
      msg.channel.send(settings.info_msg)
      break;
    case "!active":
      require("./lib/active")(msg, dclient)
      break
    case "!vote list":
      vote.list(msg)
      break
    case "!remind list":
      remind.list(msg)
      break
    case "!settings":
      let message = ""
      for (key in settings)
        if(typeof(settings[key]) == "string")
          message += `・${key}\n`
      msg.channel.send(message)
    default:
      //take argment commands
      settings.ban_words.forEach(ban_word => {
        if (msg.content.match(ban_word) && !msg.author.bot) {
          const log = settings.ban_word_log_msg.replace("<name>", msg.author.username).replace("<id>", msg.author.id).replace("<content>", msg.content).replace("<channel>", msg.channel.name).replace("<date>", moment().format(dateFormat))
          dclient.channels.find("name", settings.ban_manage_channel_name).send(log);
          return
        }
      })

      const r6s_player_data_find_cmd = msg.content.match(/^!r6s (.+)$/)
      const r6s_operator_data_find_cmd = msg.content.match(/^!r6s op (.+)$/)
      const roulette_cmd = msg.content.match(/^!roulette (.+)$/)
      const join_vc_cmd = msg.content.match(/^!joinvc (.+)$/)
      const add_vote_cmd = msg.content.match(/^!vote add (.+)/)
      const vote_cmd = msg.content.match(/^!vote (.+) (.+)$/)
      const finish_vote_cmd = msg.content.match(/^!vote finish (.+)$/)
      const remind_cmd = msg.content.match(/^!remind (\d\d:\d\d) (.+)$/)
      const msg_cmd = msg.content.match(/^!msg (.+) (.+)$/)
      const recruit_cmd = msg.content.match(/!@([-+\d]+)/)

      if (msg_cmd && msg.author.id === settings.developer_id) {
        const args = msg.content.replace("!msg ", "").split(" ")
        const channel_name = args[0]
        args.shift()
        const message = args.join(" ")
        const channel = dclient.channels.find("name", channel_name)
        if (channel) channel.send(message)
        else msg.channel.send("チャンネルが取得出来ません ＞＜;")
      } else if (r6s_operator_data_find_cmd) {
        const args = msg.content.replace("!r6s op ", "").split(" ")
        r6s.operator(msg, args)
      } else if (r6s_player_data_find_cmd) {
        const args = msg.content.replace("!r6s ", "").split(" ")
        r6s.player(msg, args)
      } else if (recruit_cmd){
        const recruit_count = parseInt(recruit_cmd[1])
        if(recruit_count > 0)
          memberRecruit.new(msg, recruit_count)
      } else if (roulette_cmd) {
        const values = msg.content.replace("!roulette ", "").split(" ")
        msg.channel.send(values[Math.floor(Math.random() * values.length)])
      } else if (add_vote_cmd) {
        const args = msg.content.replace("!vote add ", "").split(" ")
        vote.add(msg, args)
      } else if (finish_vote_cmd) {
        const args = msg.content.replace("!vote finish ", "").split(" ")
        vote.finish(msg, args)
      } else if (vote_cmd) {
        const args = msg.content.replace("!vote ", "").split(" ")
        vote.vote(msg, args)
      } else if (remind_cmd) {
        const args = msg.content.replace("!remind ", "").split(" ")
        remind.set(msg, args)
      }
  }
})

// dclient.login(process.env.discord_token)
// dclient.login(process.env.discord_token2)