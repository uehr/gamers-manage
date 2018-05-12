const settings = require("../settings.json")

module.exports = (msg) => {
  msg.channel.send({
    embed: {
      color: 8421504,
      title: settings.server_help,
    }
  }).then(sended_msg => {
    return msg.channel.send({
      embed: {
        color: 8421504,
        title: "【チャンネル】",
        fields: settings.channels_help,
      }
    })
  }).then(sended_msg => {
    return msg.channel.send({
      embed: {
        color: 8421504,
        title: `【コマンド】`,
        fields: settings.commands_help,
      }
    })
  })
}
