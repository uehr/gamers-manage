const request = require("request")
const settings = require("../settings.json")[0]

module.exports = (msg, args) => {
  msg.channel.send(settings.loading_msg).then(loading_msg => {
    const name = args[1]
    request.get(settings.operator_api_url.replace("<name>", name), (error, response, body) => {
      if (error) {
        msg.channel.send("GET request error");
        return
      }

      const res = JSON.parse(body);

      if (res.status === "failed") {
        msg.channel.send(res.errors[0].title)
        return
      }

      const operators = res.operator_records
      const indent = { name: "\u200b", value: "\u200b" }
      let atack_operators = []
      let defense_operators = []

      //プレイ時間順　
      const sorted = operators.sort((a, b) => {
        const keyA = a.stats.played,
          keyB = b.stats.played;
        if (keyA > keyB) return -1;
        if (keyA < keyB) return 1;
        return 0;
      });

      operators.some(op => {
        const operator_data = settings.r6s_operator_msg.replace("<played>", op.stats.played).replace("<wlr>", Math.floor((op.stats.wins / op.stats.losses) * 1000) / 1000).replace("<kd>", Math.floor((op.stats.kills / op.stats.deaths) * 1000) / 1000).replace("<playtime>", Math.floor(op.stats.playtime / 3600))

        if (op.operator.role === "atk" && atack_operators.length < settings.views_count * 2){
          atack_operators.push(indent)
          atack_operators.push({ name: `- ${op.operator.name} -`, value: operator_data })
        } else if (op.operator.role === "def" && defense_operators.length < settings.views_count * 2) {
          defense_operators.push(indent)
          defense_operators.push({ name: `- ${op.operator.name} -`, value: operator_data })
        } else {
          return false
        }
      })

      msg.channel.send({
        embed: {
          color: 8421504,
          title: `【${name}】オペレーター情報 (プレイ時間順)`,
        }
      }).then(sended_msg => {
        return msg.channel.send({
          embed: {
            color: 8421504,
            title: "【攻撃】",
            fields: atack_operators,
          }
        }).then(sended_msg => {
          return msg.channel.send({
            embed: {
              color: 8421504,
              title: `【防衛】`,
              fields: defense_operators,
            }
          }).then(sended_msg => {
            loading_msg.delete()
          })
        })
      })
    })
  })
}