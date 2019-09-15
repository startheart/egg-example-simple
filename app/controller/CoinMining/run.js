const CoinMining = require('./index');

let coinMining1 =  new CoinMining({
  projCode: 1, // 项目编号
  upLimit: 12 // 上限次数
})

coinMining1.run()
