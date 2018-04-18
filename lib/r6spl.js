const settings = require("../settings.json")[0]
const request = require("request")

module.exports = (msg, args) => {
  msg.channel.send(settings.loading_msg).then(loading_msg => {
    const name = args[1]
    request.get(settings.player_api_url.replace("<name>", name), (error, response, body) => {
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

      msg.channel.send({
        embed: {
          color: 8421504,
          title: `【${name}】戦績`,
          fields: [{
            name: "\u200b",
            value: player_data
          }, {
            name: "\u200B",
            value: "\u200B"
          }, {
            name: "【カジュアル】",
            value: casual_data
          }, {
            name: "\u200B",
            value: "\u200B"
          }, {
            name: "【ランク】",
            value: rank_data
          }
          ]
        }
      }).then(sended_msg => {
        loading_msg.delete()
      })
    })
  })
}