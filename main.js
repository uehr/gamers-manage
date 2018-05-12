/**
 * [using envs list]
 * twitter_consumer_key
 * twitter_consumer_secret
 * twitter_access_token_key
 * twitter_access_token_secret
 * discord_token
*/

const player_api_url = "https://api.r6stats.com/api/v1/players/<name>?platform=uplay"
const operator_api_url = "https://api.r6stats.com/api/v1/players/<name>/operators?platform=uplay"
const discord = require("discord.js")
const dclient = new discord.Client()
const settings = require("./settings.json")
const moment = require("moment")
const twitter = require("twitter")
const sleep = require("sleep-promise")
const cron = require("cron").CronJob
const http = require("http")
const vote = require("./lib/vote")
const remind = require("./lib/remind")
const r6s = require("./lib/r6s")
const settingUpdate = require("./lib/settingUpdate")

const tclient = new twitter({
  consumer_key: process.env.twitter_consumer_key,
  consumer_secret: process.env.twitter_consumer_secret,
  access_token_key: process.env.twitter_access_token_key,
  access_token_secret: process.env.twitter_access_token_secret
})

//app running check for heroku
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text:plain" })
  res.end(process.env.app_status)
}).listen(process.env.PORT || 8080)

//対象ユーザーのIDを取得
console.log("twitter: ")
settings.twitter_targets.forEach((option, index) => {
  sleep((index + 1) * 60000).then(resolve => {
    console.log(option)
    tclient.get('statuses/user_timeline', { screen_name: option.user_name }, (error, tweets, response) => {
      if (!error) {
        const user_id = tweets[0].user.id_str
        //取得できたIDを用いてストリームを生成
        tclient.stream('statuses/filter', { follow: user_id }, stream => {
          stream.on('data', tweet => {
            if ((tweet.user.id_str === user_id) && !tweet.in_reply_to_user_id) {
              if (tweet.user.screen_name === "hoge37" && tweet.text != "sync test") return
              const tweet_url = `https://twitter.com/${option.user_name}/status/${tweet.id_str}`
              dclient.channels.find("name", option.post_channel_name).send(tweet_url)
            }
          })
        })
      }
    })
  }).catch(error => {
    console.log(error)
  })
})

dclient.on("ready", () => {
  console.log("started: " + moment().format(settings.date_format))
})

dclient.on("guildMemberAdd", member => {
  const name = member.user.username
  const user_status = settings.join_random_msg[Math.floor(Math.random() * settings.join_random_msg.length)]
  dclient.channels.find("name", settings.welcome_msg_channel_name).send(settings.join_msg.replace("<name>", name).replace("<status>", user_status))
})

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
          message += key + "\n"
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
      const settings_update_cmd = msg.content.match(/^!update (.+) (.+)$/)
      const settings_get_cmd = msg.content.match(/^!get (.+)$/)

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
      } else if (msg.channel.name == "admin" && settings_update_cmd) {
        const args = msg.content.replace("!update ", "").split(" ")
        settingUpdate.update(msg, args[0], args[1])
      } else if(msg.channel.name == "admin" && settings_get_cmd) {
        const args = msg.content.replace("!get ", "").split(" ")
        let message = "キーが見つかりません"
        if(args[0] in settings)
          message = settings[args[0]]
        msg.channel.send(message)
      }
  }
})

dclient.login(process.env.discord_token)