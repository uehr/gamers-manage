module.exports = (msg, dclient) => {
  let message = "- *Active VC* -\n"
  dclient.channels.forEach(channel => {
    if (channel.type === "voice") {
      let joined_user_count = 0
      channel.members.forEach(details => {
        joined_user_count++;
      })
      if (joined_user_count)
        message += `[${channel.name}] - ${joined_user_count}人\n`
    }
  })
  msg.channel.send(message)
}