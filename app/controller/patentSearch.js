const Controller = require('egg').Controller;

const POST_URL = 'http://epub.sipo.gov.cn/patentoutline.action'

const COOKIE = `WEB=20111130; Hm_lvt_06635991e58cd892f536626ef17b3348=1525065503; _gscu_7281245=25065502xm2iz720; _gscbrs_7281245=1; TY_SESSION_ID=6c6916a5-2b57-49df-8ea8-98ae96c4448e; preurl=/patentoutline.action; JSESSIONID=DAE8C6CDD50FE0A07FC3E50B0495F7A0; captchaKey=5d3329890e; captchaExpire=1525194289; keycookie=a0ab6d9062; expirecookie=1525194334; Hm_lpvt_06635991e58cd892f536626ef17b3348=1525195403; _gscs_7281245=t25194380e6eu2i14|pv:5; captchaNum=7753`

var sleep = function (time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            // 模拟出错了，返回 ‘error’
            reject('error');
        }, time);
    })
};

class PatentSearchController extends Controller {

  async home() {
  	const ctx = this.ctx;
  	const query = ctx.query
  	const strSearch = query.strSearch

  	const strWhere = `PA,IN,AGC,AGT+='%` + strSearch + `%' or PAA,TI,ABH+='` + strSearch + `'`
  	const showType = 1
  	const numSortMethod = 4
	const pageSize  = 10
	const pageNow = 1
	const strSources = 'pip' //发明公布、pig 发明授权

	let maxPage = 0
	debugger
	try {
		maxPage = await this.getMaxPage({
			strWhere,
			showType,
			numSortMethod,
			pageSize,
			pageNow,
			strSources
		})
	} catch (err) {
		return ctx.body = err.message
	}

	let dataAll = []

	for (let i = 1; i < maxPage; i++) {
		const formData = {
			strWhere,
			showType,
			numSortMethod,
			pageSize,
			pageNow: i,
			strSources
		}
		// 沉睡3秒
		await sleep(3000)
		const curPageData = await this.getCurPageData(formData)
		dataAll = dataAll.concat(curPageData)
	}

	debugger
	ctx.body = dataAll
  }

  // 获取全部有效匹配信息
  async getCurPageData(formData) {
  	const html = await this.post(formData)

  	const reg = /<div class="cp_linr">([\s\S]*?)<a class="qrcode"/g

  	let mat
  	let dataArr = []
  	while ((mat = reg.exec(html)) != null)  {
	  let str = mat[1]
	  let res = {}

	  const regH1 = /<h1>\s*(\S*)<\/h1>/g;
	  const regAnnNum = /<li class="wl228">申请公布号：(.*)<\/li>/
	  const regAnnDate = /<li class="wl228">申请公布日：(.*)<\/li>/
	  const regApplyNum = /<li class="wl228">申请号：(.*)<\/li>/
	  const regApplyDate = /<li class="wl228">申请日：(.*)<\/li>/
	  const regApplicant = /<li class="wl228">申请人：(.*)<\/li>/
	  const regInventor = /<li class="wl228">发明人：(.*)<\/li>/
	  const regAddr = /<li>地址：(.*)<\/li>/
	  const regClfNum = /<li>分类号：([\s\S]*?)<\/ul>/
	  const regSum = /<span id="tit">\s*摘要：\s*<\/span>(?:\s*)([\s\S]*?)(?:<\/)/g

	  res.h1 = this.getExContent(str, regH1)
	  res.annNum = this.getExContent(str, regAnnNum)
	  res.annDate = this.getExContent(str, regAnnDate)
	  res.applyNum = this.getExContent(str, regApplyNum)
	  res.applyDate = this.getExContent(str, regApplyDate)
	  res.applicant = this.getExContent(str, regApplicant)
	  res.inventor = this.getExContent(str, regInventor)
	  res.addr = this.getExContent(str, regAddr)
	  res.clfNum = this.getExContent(str, regClfNum)
	  res.sum = this.getExContent(str, regSum)

	  dataArr.push(res)
	}

	return dataArr
  }


  // 获取最大页数
  async getMaxPage(formData) {
  	const html = await this.post(formData)

  	const maxReg = /zl_tz\((.*)\)/i;

  	const maxPage = this.getExContent(html, maxReg)

  	if (maxPage) {
  		return parseInt(maxPage)
  	} else {
  		const errStr = html.replace('/get-captcha.jpg', 'http://epub.sipo.gov.cn/get-captcha.jpg')
  		throw new Error(errStr)
  	}
  }

  // post 请求
  async post(formData) {
    const ctx = this.ctx;

    try {
	    const result = await ctx.curl(POST_URL, {
	      // 必须指定 method
	      method: 'POST',
	      // 通过 contentType 告诉 httpclient 以 JSON 格式发送
	      contentType: 'application/x-www-form-urlencoded',
	      headers: {
	        cookie: COOKIE
	      },
	      data: formData,
	      // 明确告诉 httpclient 以 JSON 格式处理响应 body
	      dataType: 'text',
	    });
	    return result.data;
	} catch (e) {
		console.error(`ctx.curl(${POST_URL}) error`, e)
		return ''
	}
  }

  // 依据给定正则获取数据源
  getExContent(content, reg) {
  	if (reg.test(content)) {
  		return RegExp.$1
  	}
  	return ''
  }
}

module.exports = PatentSearchController