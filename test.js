const discord = require("discord.js")
const dclient = new discord.Client()
const moment = require("moment")
const settings = require("./settings.json")[0]
const settingUpdate = require("./lib/settingUpdate")

dclient.on("ready", () => {
  console.log("started")
  vc = dclient.channels.find("name", "General")
})

dclient.on("message", msg => {
  settingUpdate.update(msg, "info_msg", "ようそこ！")
})

dclient.login("NDE4MjQ5MTY2NzY3MTI4NTg3.DbYkcQ.4ZulrblJrePOo-kcBep61TtA9NY")