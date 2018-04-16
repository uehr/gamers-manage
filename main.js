/**
 * [using envs list]
 * twitter_consumer_key
 * twitter_consumer_secret
 * twitter_access_token_key
 * twitter_access_token_secret
 * discord_token
*/

const request = require("request")
const player_api_url = "https://api.r6stats.com/api/v1/players/<name>?platform=uplay"
const operator_api_url = "https://api.r6stats.com/api/v1/players/<name>/operators?platform=uplay"
const discord = require("discord.js")
const dclient = new discord.Client()
const settings = require("./settings.json")[0]
const moment = require("moment")
const dateFormat = "YYYY-MM-DD hh:mm:ss"
const cron = require("node-cron")
const twitter = require("twitter")
const sleep = require("sleep-promise")
const bgm_path = "./bgm/<number>.mp3"
const tclient = new twitter({
  consumer_key: process.env.twitter_consumer_key,
  consumer_secret: process.env.twitter_consumer_secret,
  access_token_key: process.env.twitter_access_token_key,
  access_token_secret: process.env.twitter_access_token_secret
})
let vote_asks = []

//対象ユーザーのIDを取得
console.log("twitter: ")
settings.twitter_targets.forEach((option, index) => {
  sleep(index * 5000).then(resolve => {
    console.log(option)
    tclient.get('statuses/user_timeline', { screen_name: option.user_name }, (error, tweets, response) => {
      if (!error) {
        const user_id = tweets[0].user.id_str
        //取得できたIDを用いてストリームを生成
        tclient.stream('statuses/filter', { follow: user_id }, stream => {
          stream.on('data', tweet => {
            if ((tweet.user.id_str === user_id) && !tweet.in_reply_to_user_id) {
              if (tweet.user.screen_name === "hoge37" && tweet.text != "sync test") return
              const tweet_url = `https://twitter.com/${option.user_name}/status/${tweet.id_str}`
              dclient.channels.find("name", option.post_channel_name).send(tweet_url)
            }
          })
        })
      }
    })
  })
})

cron.schedule(`0 0 ${settings.info_hour} * * * *`, () => {
  dclient.channels.find("name", settings.info_msg_channel_name).send(settings.info_msg)
})

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

dclient.on("ready", () => {
  console.log("started: " + moment().format(dateFormat))
})

dclient.on("guildMemberAdd", member => {
  const name = member.user.username
  dclient.channels.find("name", settings.welcome_msg_channel_name).send(settings.join_msg.replace("<name>", name))
})

dclient.on("message", msg => {
  switch (msg.content) {
    case "!help":
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
      break;
    case "!now":
      msg.channel.send(moment().format(dateFormat))
      break;
    case "!info":
      msg.channel.send(settings.info_msg)
      break;
    case "!active":
      let message = "- *Active VC* -\n"
      dclient.channels.forEach(channel => {
        if (channel.type === "voice") {
          let joined_user_count = 0
          channel.members.forEach(details => {
            joined_user_count++;
          })

          if (joined_user_count) {
            message += `[${channel.name}] - ${joined_user_count}人\n`
          }
        }
      })
      msg.channel.send(message)
      break
    case "!vote list":
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
      break
    default:
      //take argment commands
      settings.ban_words.forEach(ban_word => {
        if (msg.content.match(ban_word) && !msg.author.bot) {
          const log = settings.ban_word_log_msg.replace("<name>", msg.author.username).replace("<id>", msg.author.id).replace("<content>", msg.content).replace("<channel>", msg.channel.name).replace("<date>", moment().format(dateFormat))
          dclient.channels.find("name", settings.ban_manage_channel_name).send(log);
          return
        }
      })

      const r6s_player_data_find = msg.content.match(/^!r6s (.+)$/)
      const r6s_operator_data_find = msg.content.match(/^!r6s op (.+)$/)
      const roulette = msg.content.match(/^!roulette (.+)$/)
      const join_vc = msg.content.match(/^!joinvc (.+)$/)
      const add_vote_ask = msg.content.match(/^!vote add (.+)/)
      const vote = msg.content.match(/^!vote (.+) (.+)$/)
      const finish_vote = msg.content.match(/^!vote finish (.+)$/)

      if (r6s_operator_data_find) {
        msg.channel.send(settings.loading_msg).then(loading_msg => {
          const name = r6s_operator_data_find[1]
          request.get(operator_api_url.replace("<name>", name), (error, response, body) => {
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

              if (op.operator.role === "atk" && atack_operators.length < settings.views_count * 2) {
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
      } else if (r6s_player_data_find) {
        msg.channel.send(settings.loading_msg).then(loading_msg => {
          const name = r6s_player_data_find[1]
          request.get(player_api_url.replace("<name>", name), (error, response, body) => {
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
      } else if (roulette) {
        const values = msg.content.replace("!roulette ", "").split(" ")
        msg.channel.send(values[Math.floor(Math.random() * values.length)])
      } else if (add_vote_ask) {
        const ask_title = add_vote_ask[1].split(" ")[0]
        const ask_num = getAskNum(ask_title)
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
      } else if (finish_vote) {
        const ask_title = finish_vote[1]
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
      } else if (vote) {
        const ask_title = vote[1]
        let ask_num
        const answer = vote[2]
        const voter_id = msg.author.id
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
      }
  }
})

dclient.login(process.env.discord_token)
