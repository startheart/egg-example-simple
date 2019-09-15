const axios = require('axios');
const url = require('url')
const URLSearchParams = url.URLSearchParams

const HOST = 'http://api.fxhyd.cn'

const BASE_URL = url.resolve(HOST, 'UserInterface.aspx')

const TOKEN = '005314110124581035ac248d059647d5d27d1763'

/**
 * 1001:参数token不能为空
1002:参数action不能为空
1003:参数action错误
1004:token失效
1005:用户名或密码错误
1006:用户名不能为空
1007:密码不能为空
1008:账户余额不足
1009:账户被禁用
1010:参数错误
1011:账户待审核
1012:登录数达到上限
2001:参数itemid不能为空
2002:项目不存在
2003:项目未启用
2004:暂时没有可用的号码
2005:获取号码数量已达到上限
2006:参数mobile不能为空
2007:号码已被释放
2008:号码已离线
2009:发送内容不能为空
2010:号码正在使用中
3001:尚未收到短信
3002:等待发送
3003:正在发送
3004:发送失败
3005:订单不存在
3006:专属通道不存在
3007:专属通道未启用
3008:专属通道密码与项目不匹配
9001:系统错误
9002:系统异常
9003:系统繁忙
 */


class CoinMining {
  construtor(opts) {
    super(opts)

    this.init(opts)
  }

  init(opts) {
    this.projCode = opts.projCode
    this.upLimit = opts.upLimit
  }

  async getaccountinfo() {
    const params = new URLSearchParams([
      ['action', 'getaccountinfo'],
      ['token', TOKEN],
      ['format', 1]
    ]);

    const url = `${BASE_URL}?${params}`
    const res = await axios.get(url)
    const resHandled = resMidHandler(res)

    if (resHandled.errno == 0) {

    }


  }

  async getaccountinfo() {
    const params = new URLSearchParams([
      ['action', 'getmobile'],
      ['token', TOKEN],
      ['itemid', this.projCode]
    ]);

    const url = `${BASE_URL}?${params}`
    const res = await axios.get(url)
    const resHandled = resMidHandler(res)

    if (resHandled.errno == 0) {
      //
    } else {

    }


  }

  resMidHandler(code) {
    let ret = null
    switch(code) {
      case '1001':
        ret = {
          errno: '1001',
          data: '参数token不能为空'
        }
      break;
      case '1002':
        ret = {
          errno: '1002',
          data: '参数action不能为空'
        }
      break;
      case '1003':
        ret = {
          errno: '1003',
          data: '参数action错误'
        }
      break;
      case '1004':
        ret = {
          errno: '1004',
          data: '参数token不能为空'
        }
      break;
      case '1005':
        ret = {
          errno: '1005',
          data: '参数token不能为空'
        }
      break;
      case '1006':
        ret = {
          errno: '1006',
          data: '参数token不能为空'
        }
      break;
      case '1007':
        ret = {
          errno: '1007',
          data: '参数token不能为空'
        }
      break;
      case '1008':
        ret = {
          errno: '1008',
          data: '参数token不能为空'
        }
      break;
      case '1009':
        ret = {
          errno: '1009',
          data: '参数token不能为空'
        }
      break;
      case '1010':
        ret = {
          errno: '1010',
          data: '参数token不能为空'
        }
      break;
      case '1011':
        ret = {
          errno: '1011',
          data: '参数token不能为空'
        }
      break;
      case '1012':
        ret = {
          errno: '1012',
          data: '参数token不能为空'
        }
      break;
      case '2001':
        ret = {
          errno: '2001',
          data: '参数token不能为空'
        }
      break;
      case '2002':
        ret = {
          errno: '2002',
          data: '参数token不能为空'
        }
      break;
      case '2003':
        ret = {
          errno: '2003',
          data: '参数token不能为空'
        }
      break;
      case '2004':
        ret = {
          errno: '2004',
          data: '参数token不能为空'
        }
      break;
      case '2005':
        ret = {
          errno: '2005',
          data: '参数token不能为空'
        }
      break;
      case '2006':
        ret = {
          errno: '2006',
          data: '参数token不能为空'
        }
      break;
      case '2007':
        ret = {
          errno: '2007',
          data: '参数token不能为空'
        }
      break;
      case '2008':
        ret = {
          errno: '2008',
          data: '参数token不能为空'
        }
      break;
      case '2009':
        ret = {
          errno: '2009',
          data: '参数token不能为空'
        }
      break;
      case '2010':
        ret = {
          errno: '2010',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      case '3001':
        ret = {
          errno: '3001',
          data: '参数token不能为空'
        }
      break;
      default:
        ret = {
          errno: '0',
          data: code
        }
      break;

      return ret

    }
  }


}

module.exports = CoinMining
