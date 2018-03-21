const request = require("request")
const url = "https://api.r6stats.com/api/v1/players/<name>?platform=uplay"
const discord = require("discord.js")
const client = new discord.Client()
const settings = require("./settings.json")[0]
const moment = require("moment")
const dateFormat = "YYYY-MM-DD hh:mm:ss"

client.on("ready", () => {
  console.log("started: " + moment().format(dateFormat))
});

client.on("guildMemberAdd", member => {
  client.channels.find("name", settings.welcome_msg_channel_name).send(settings.join_msg)
});

client.on("message", msg => {
  switch (msg.content) {
    case "!help":
      msg.channel.send(settings.help_msg)
      break;
    case "!now":
      msg.channel.send(moment().format(dateFormat))
      break;
    case "!info":
      msg.channel.send(settings.info_msg)
      break;
    case "!dev":
      msg.channel.send(settings.dev_msg)
      break;
    case "!hoge":
      console.log()

      break;
    default:
      settings.ban_words.forEach(ban_word => {
        if(msg.content.match(ban_word) && !msg.author.bot){
          const log = settings.ban_word_log_msg.replace("<name>", msg.author.username).replace("<id>", msg.author.id).replace("<content>", msg.content).replace("<channel>", msg.channel.name).replace("<date>", moment().format(dateFormat))
          client.channels.find("name", settings.ban_manage_channel_name).send(log);
          return
        }
      });
      let r6s_player_find = msg.content.match(/^!r6s (.+)/)
      if (r6s_player_find) {
        const name = r6s_player_find[1]
        request.get(url.replace("<name>", name), (error, response, body) => {
          if (error) {
            msg.channel.send("GET request error");
            return
          }

          const res = JSON.parse(body);

          if (res.status === "failed") {
            msg.channel.send(res.errors[0].title)
            return
          }

          const casual = res.player.stats.casual
          const rank = res.player.stats.ranked
          const progression = res.player.stats.progression
          const overall = res.player.stats.overall

          //player
          const player_data = settings.r6s_player_msg.replace("<level>", progression.level).replace("<xp>", progression.xp).replace("<headshots>", overall.headshots).replace("<assists>", overall.assists) + "\n\n"

          //casual
          const casual_data = settings.r6s_battle_record_msg.replace("<wins>", casual.wins).replace("<losses>", casual.losses).replace("<wlr>", casual.wlr).replace("<kills>", casual.kills).replace("<deaths>", casual.deaths).replace("<kd>", casual.kd).replace("<playtime>", Math.floor(casual.playtime / 3600)) + "\n\n"

          //ranked
          const rank_data = settings.r6s_battle_record_msg.replace("<wins>", rank.wins).replace("<losses>", rank.losses).replace("<wlr>", rank.wlr).replace("<kills>", rank.kills).replace("<deaths>", rank.deaths).replace("<kd>", rank.kd).replace("<playtime>", Math.floor(rank.playtime / 3600))

          msg.channel.send({embed: {
              color: 8421504,
              title: `- ${name} -`,
              image: {
                url: "https://www.iwantcheats.net/wp-content/uploads/2015/12/tom-clany-rainbow-six-siege-logo-png.png",
              },
              fields: [{
                  name: "\u200B",
                  value: player_data
                },{
                  name: "\u200B",
                  value: "\u200B"
                },{
                  name: "【カジュアル】",
                  value: casual_data
                },{
                  name: "\u200B",
                  value: "\u200B"
                },{
                  name: "【ランク】",
                  value: rank_data
                },{
                  name: "\u200B",
                  value: "\u200B"
                }
              ],
            }
          });
        })
      }
  }
})

client.login(settings.token)