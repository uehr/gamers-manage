const settings = require("../settings.json")

initialRecruitCount = (msg_content) => {
  return parseInt(msg_content.match(/!@([-+\d]+)/)[1])
}

updateRecruitCount = (details) => {
  const join_count = details.users.size
  const initial_count = initialRecruitCount(details.message.content)
  const new_count = initial_count - join_count
  const previous_msg = details.message.content
  const recruit_user_msg = previous_msg.split("\n")[1]
  const new_recruit_msg = settings.recruit_msg.replace("<count>", new_count)
  const new_msg = new_recruit_msg + "\n" + recruit_user_msg
  details.message.edit(new_msg)
}

isTargetReaction = (details) => {
  const is_recruit = details.message.content.match(/[募集]/)
  const is_bot = details.message.author.bot
  const is_target_reaction = details._emoji.name === settings.join_reaction

  return is_bot && is_target_reaction
}

module.exports = {
  register: (dclient) => {
    dclient.on("messageReactionAdd", (details, user) => {
      if(isTargetReaction(details)) updateRecruitCount(details)
    })
    dclient.on("messageReactionRemove", (details, user) => {
      if(isTargetReaction(details)) updateRecruitCount(details)
    })
  },
  new: (msg, recruitCount) => {
    const is_bot = msg.author.bot
    if(is_bot) return
    recruit_msg = settings.recruit_msg.replace("<count>", recruitCount)

    recruit_user_msg = settings.recruit_user_msg
                               .replace("<username>", msg.author.username)
                               .replace("<msg>", msg.content)

    msg.channel.send(recruit_msg + "\n" + recruit_user_msg)
  }
}