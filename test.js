const twitter = require("twitter")

const tclient = new twitter({
  consumer_key: process.env.twitter_consumer_key,
  consumer_secret: process.env.twitter_consumer_secret,
  access_token_key: process.env.twitter_access_token_key,
  access_token_secret: process.env.twitter_access_token_secret
});

//対象ユーザーのIDを取得
const user_name = "R6Snews"
tclient.get('statuses/user_timeline', {screen_name: user_name}, (error, tweets, response) => {
  if (error) throw error
  const user_id = tweets[0].user.id_str
  //取得できたIDを渡してストリームを生成
  tclient.stream('statuses/filter', {follow : user_id}, stream => {
    stream.on('data', tweet => {
      console.log(tweet)
      // const tweet_url = `https://twitter.com/${user_name}/status/${tweet.id_str}`
      // console.log(tweet_url)
    })
  })
})