const settings = require("../settings.json")

getRecruitCount = (text) => {
  return parseInt(text.match(/@([-+\d]+)/)[1])
}

module.exports = {
  register: (dclient) => {
    dclient.on("messageReactionAdd", (details, user) => {
      const content = details.message.content
      if(details.message.author.bot && details._emoji.name === settings.join_reaction){
        afterCount = getRecruitCount(content) - 1
        details.message.edit(settings.recruit_msg.replace("<count>", afterCount))
      }
    })
    dclient.on("messageReactionRemove", (details, user) => {
      const content = details.message.content
      if(details.message.author.bot && details._emoji.name === settings.join_reaction){
        details.message.edit(settings.recruit_msg.replace("<count>", getRecruitCount(content) + 1))
      }
    })
  },
  new: (msg, recruitCount) => {
    msg.channel.send(settings.recruit_msg.replace("<count>", recruitCount))
  }
}