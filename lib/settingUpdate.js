const setting_path = "./settings.json"
let settings = require("../settings.json")
const fs = require("fs")

module.exports = {
  update: (msg, title, value) => {
    if (!(title in settings))
      throw "unknown title"

    const previousValue = settings[title]
    settings[title] = value
    const newSettings = JSON.stringify(settings, null, "  ")

    fs.writeFile(setting_path, newSettings, err => {
      if(err) throw err
      else {
        msg.channel.send(`アップデートが完了しましたっ！\nPrevious: ${previousValue}\nNew: ${value}`)
      }
    })
  }
}