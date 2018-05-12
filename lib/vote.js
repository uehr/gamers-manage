const settings = require("../settings.json")
let vote_asks = []

const isExistsAskTitle = (title) => {
  return new Promise(resolve => {
    vote_asks.forEach(vote_ask => {
      if (vote_ask.title === title) resolve(true)
    })
    resolve(false)
  })
}

const isExistsAskNum = (ask_num) => {
  return new Promise(resolve => {
    resolve(ask_num >= 0 && ask_num < vote_asks.length)
  })
}

const getAskNum = (title) => {
  return new Promise(resolve => {
    vote_asks.forEach((vote_ask, index) => {
      if (vote_ask.title === title)
        resolve(index)
    })
    resolve(-1)
  })
}

const isValidAnserFormat = (ask_title, answer) => {
  return new Promise(resolve => {
    getAskNum(ask_title).then(ask_num => {
      const vote_ask = vote_asks[ask_num]
      for (answer_format in vote_ask.answers_log)
        if (answer_format === answer) resolve(true)
      resolve(false)
    })
  })
}

const isAnswerdUser = (ask_title, voter_id) => {
  return new Promise(resolve => {
    getAskNum(ask_title).then(ask_num => {
      const voters_id = vote_asks[ask_num].voters_id
      voters_id.forEach(id => {
        if (id === voter_id) resolve(true)
      })
      resolve(false)
    })
  })
}

const isAdminName = (user_name) => {
  return new Promise(resolve => {
    settings.admins_name.forEach(admin_name => {
      if (admin_name === user_name) resolve(true)
    })
    resolve(false)
  })
}

module.exports = {
  add: (msg, args) => {
    const ask_title = args[0]
    const answer_formats = msg.content.replace(`!vote add ${ask_title} `, "").split(" ")
    isExistsAskTitle(ask_title).then(isExists => {
      if (isExists) {
        throw "exists ask title"
      } else if (!answer_formats || answer_formats.length < 2) {
        throw "invalid answer format"
      } else if (vote_asks.length > 10) {
        throw "ask limit"
      } else if (answer_formats.length > 10) {
        throw "answer limit"
      } else {
        let answers_logger = {}
        let embed_answers = ""
        answer_formats.forEach(format => {
          if (format) {
            answers_logger[format] = 0
            embed_answers += `[${format}] `
          }
        })
        vote_asks.push({ title: ask_title, asker_id: msg.author.id, answers_log: answers_logger, voters_id: [], total_answer: 0 })
        msg.channel.send(`投票項目を登録しましたっ！`).then(sended_msg => {
          msg.channel.send({
            embed: {
              color: 0xf46e41,
              title: `${ask_title} ${embed_answers}`
            }
          })
        })
      }
    }).catch(error => {
      switch (error) {
        case "exists ask title":
          msg.channel.send("既に同じ投票項目が存在します＞＜;")
          break
        case "invalid answer format":
          msg.channel.send("アンサーフォーマットが不正です＞＜;")
          break
        case "ask limit":
          msg.channel.send("投票項目は10個が限界です＞＜;")
          break
        case "answer limit":
          msg.channel.send("解答フォーマットは10個が限界です＞＜;")
          break
        default:
          console.log("error: " + error)
          break
      }
    })
  },
  finish: (msg, args) => {
    const ask_title = args[0]
    let ask_num
    let vote_ask
    getAskNum(ask_title).then(num => {
      if (num == -1) throw "not exists ask title"
      else {
        vote_ask = vote_asks[num]
        ask_num = num
        return new Promise(resolve => {
          resolve(vote_ask.asker_id === msg.author.id || isAdminName(msg.author.username))
        })
      }
    }).then(isAsker => {
      if (!isAsker) throw "can't finish except asker"
      else {
        const answers_log = vote_ask.answers_log
        const vote_total = vote_ask.voters_id.length
        msg.channel.send({
          embed: {
            color: 0xf46e41,
            title: `${vote_ask.title} - ${vote_total}票`
          }
        }).then(sended_msg => {
          for (answer in answers_log) {
            const vote_count = answers_log[answer]
            const persent = (vote_total < 1 ? 0 : Math.round(vote_count / vote_total * 100))
            msg.channel.send({
              embed: {
                color: 8421504,
                title: `${answer} - ${persent}%`
              }
            })
          }
          vote_asks.splice(ask_num, 1)
        })
      }
    }).catch(error => {
      switch (error) {
        case "not exists ask title":
          msg.channel.send("存在しない項目です＞＜;")
          break
        case "can't finish except asker":
          msg.channel.send("終了出来るのは本人のみです＞＜;")
          break
        default:
          console.log("error: " + error)
      }
    })
  },
  vote: (msg, args) => {
    const ask_title = args[0]
    const answer = args[1]
    const voter_id = msg.author.id
    let ask_num
    getAskNum(ask_title).then(num => {
      if (num == -1) throw "not exists ask title"
      else {
        ask_num = num
        return isValidAnserFormat(ask_title, answer)
      }
    }).then(isValid => {
      if (!isValid) throw "invalid answer format"
      else return isAnswerdUser(ask_title, voter_id)
    }).then(isAnswerd => {
      if (isAnswerd) throw "is answerd user"
      else {
        let vote_ask = vote_asks[ask_num]
        vote_ask.answers_log[answer]++
        vote_ask.voters_id.push(voter_id)
        msg.channel.send("投票しましたっ！")
      }
    }).catch(error => {
      switch (error) {
        case "not exists ask title":
          msg.channel.send("存在しない項目です＞＜;")
          break
        case "invalid answer format":
          msg.channel.send("アンサーフォーマットが不正です＞＜;")
          break
        case "is answerd user":
          msg.channel.send("二度目の投票は出来ません＞＜;")
          break
        default:
          console.log("error: " + error)
          break
      }
    })
  },
  list: (msg) => {
    let have_ask = false
    vote_asks.forEach(ask => {
      let answers = ""
      have_ask = true
      for (answer in ask.answers_log) {
        answers += `[${answer}] `
      }
      msg.channel.send({
        embed: {
          color: 0xf46e41,
          title: `${ask.title} ${answers}`,
        }
      })
    })
    if (!have_ask) msg.channel.send("項目がありません＞＜；")
  }
}