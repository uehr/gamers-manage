const settings = require("../settings.json")

initialRecruitCount = (text) => {
  return parseInt(text.match(/\[([-+\d])\]/)[1])
}

updateRecruitCount = (details) => {
  const joinCount = details.users.size
  const afterCount = joinCount - 1
  const content = details.message.content
  const initial = initialRecruitCount(content)
  afterMsg = settings.recruit_msg
                    .replace("<count>", initial - joinCount)
                    .replace("<initial>", initial)
  details.message.edit(afterMsg)
}

isTargetReaction = (details) => {
  return details.message.author.bot &&
         details.message.content.match(/!@([-+\d]+) 募集中です ＞＜;[\[([-+\d])\]]/) &&
         details._emoji.name === settings.join_reaction
}

module.exports = {
  register: (dclient) => {
    dclient.on("messageReactionAdd", (details, user) => {
      if(details.message.author.bot && details._emoji.name === settings.join_reaction)
        updateRecruitCount(details)
    })
    dclient.on("messageReactionRemove", (details, user) => {
      if(details.message.author.bot && details._emoji.name === settings.join_reaction)
        updateRecruitCount(details)
    })
  },
  new: (msg, recruitCount) => {
    message = settings.recruit_msg
                      .replace("<count>", recruitCount)
                      .replace("<initial>", recruitCount)
    msg.channel.send(message)
  }
}