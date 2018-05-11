const fs = require('fs');
const path = require('path');
const axios = require('axios');
const querystring = require('querystring');
const xlsx = require('node-xlsx');

const Controller = require('egg').Controller;

const HOST = 'http://epub.sipo.gov.cn'

const POST_URL = HOST + '/patentoutline.action'

let COOKIE = `WEB=20111130; _gscu_7281245=25065502xm2iz720; _gscbrs_7281245=1; TY_SESSION_ID=6c6916a5-2b57-49df-8ea8-98ae96c4448e; Hm_lvt_06635991e58cd892f536626ef17b3348=1525065503,1525517686,1525518553,1525518598; preurl=/patentoutline.action; JSESSIONID=0C890F1E9B3972872879F324C2723149; captchaNum=4547; captchaKey=b2b95c1b2e; captchaExpire=1525537347; keycookie=93a65b625d; expirecookie=1525537874; Hm_lpvt_06635991e58cd892f536626ef17b3348=1525539454; _gscs_7281245=t25538214ax7z2n10|pv:15`

const OUTPUT_DIR_PATH = path.join(__dirname, '../public')

const sheetNameSet = {
	'pip': '发明公布',
	'pig': '发明授权'
}

const sheetMap =  {
	'发明公布': 'pip',
	'发明授权': 'pig'
}

const sheetHead = {
	'pip': ['专利标题', '申请公布号', '申请公布日', '申请号', '申请日', '申请人', '发明人', '地址', '分类号', '摘要'],
	// 发明授权
	'pig': ['专利标题', '授权公告号', '申请公布日', '申请号', '申请日', '专利权人', '发明人', '地址', '分类号', '摘要', '授权公告日', '同一申请的已公布的文献号'] 
}

let sleep = function (time) {
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

  	let searchList = ['区块链', '人工智能', '大数据', '云计算', '移动支付', '互联网保险', '供应链金融', '网络借贷', '股权众筹', '智能投顾', '大数据征信']

  	this.curPageCache = {
		'pip': 1,
		'pig': 1
	}
  	await this.mainProcessNext(searchList)
  }

  async mainProcessNext(searchList) {
  	const ctx = this.ctx
  	const strSearch = this.strSearch = searchList.shift()

  	if (!strSearch) {
  		return
  	}

  	const strWhere = `PA,IN,AGC,AGT+='%` + strSearch + `%' or PAA,TI,ABH+='` + strSearch + `'`
  	const showType = 1
  	const numSortMethod = 4
	const pageSize  = 10
	const pageNow = 1
	const strSources = ['pip', 'pig'] //发明公布、pig 发明授权

	this.pageSize = pageSize

  	this.excelPath = this.checkExcelFile()
  	this.dataAll = []

  	try {
		let resolve = []
		// for (let i in strSources) {
		// 	
		// 	this.curSheetSrc = strSources[i]
		// 	resolve = await this.process({
		// 		strWhere,
		// 		showType,
		// 		numSortMethod,
		// 		pageSize,
		// 		pageNow,
		// 		strSources: this.curSheetSrc
		// 	})
		// }
		
		this.curSheetSrc = strSources[0]
		this.isAuthType = this.curSheetSrc === 'pig'

		resolve[0] = await this.process({
			strWhere,
			showType,
			numSortMethod,
			pageSize,
			pageNow,
			strSources: this.curSheetSrc
		})

		this.curSheetSrc = strSources[1]
		this.isAuthType = this.curSheetSrc === 'pig'

		resolve[1] = await this.process({
			strWhere,
			showType,
			numSortMethod,
			pageSize,
			pageNow,
			strSources: this.curSheetSrc
		})

		ctx.body = resolve
	} catch (err) {
		return ctx.body = err.message
	}

	await this.mainProcessNext(searchList)
  }

  updateCurPageNum() {
  	const workSheetsFromFile = xlsx.parse(this.excelPath);

  	this.workSheets = []
  	workSheetsFromFile.forEach((item, index) => {
  		let name = item.name
  		let source = sheetMap[name]

  		let data = item.data
  		
  		if (source === this.curSheetSrc) {
  			this.curSheet = {
  				name,
  				data
  			}
  			this.curPageCache[source] = Math.floor(data.length / this.pageSize)
  		} else {
  			this.workSheets.push(item)
  		}
  	})

  }

  async process(formData) {
  	this.updateCurPageNum()

  	let maxPage = 0
	
	try {
		maxPage = await this.getMaxPage(formData)
	} catch (err) {
		throw new Error(err.message)
	}

	let dataAll = []

	const data = {
		...formData,
		pageNow: this.curPageCache[this.curSheetSrc]
	}
	
	await this.processNext(data, maxPage)
	
  }

  async processNext(data, maxPage) {

  	if (data.pageNow > maxPage) {
  		return null
  	} else {
  		const curPageData = await this.getCurPageData(data)
  		this.dataAll.concat(curPageData)

  		data.pageNow++

  		await sleep(1000)
  		await this.processNext(data, maxPage)
  	}
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

	  const regH1 = /<h1>\s*(\S*?)<\/h1>/g;

	  const regAnnNum = !this.isAuthType
	  				    ? /<li class="wl228">申请公布号：([\s\S]*?)<\/li>/
	  				    : /<li class="wl228">授权公告号：([\s\S]*?)<\/li>/

	  const regAnnDate = /<li class="wl228">申请公布日：([\s\S]*?)<\/li>/

	  const regApplyNum = /<li class="wl228">申请号：([\s\S]*?)<\/li>/

	  const regApplyDate = /<li class="wl228">申请日：([\s\S]*?)<\/li>/

	  const regApplicant = !this.isAuthType
	  				    ? /<li class="wl228">申请人：([\s\S]*?)<\/li>/
	  				    : /<li class="wl228">专利权人：([\s\S]*?)<\/li>/

	  const regInventor = /<li class="wl228">发明人：([\s\S]*?)<\/li>/
	  const regAddr = /<li>地址：([\s\S]*?)<\/li>/
	  const regClfNum = /<li>分类号：([\s\S]*?)<\/ul>/
	  const regSum = /<span id="tit">\s*摘要：\s*<\/span>(?:\s*)([\s\S]*?)(?:<\/)/g


	  if(this.isAuthType) {
	  	const regAuthDate = /<li class="wl228">授权公告日：([\s\S]*?)<\/li>/
	  	const regOtherApply = /<li class="wl228">同一申请的已公布的文献号：([\s\S]*?)<\/li>/

	  	res.authDate = this.getExContent(str, regAuthDate)
	  	res.otherApply = this.getExContent(str, regOtherApply)
	  }

	  res.h1 = this.getExContent(str, regH1)
	  				.replace(/&nbsp;/g, '')
	  res.annNum = this.getExContent(str, regAnnNum)
	  res.annDate = this.getExContent(str, regAnnDate)
	  res.applyNum = this.getExContent(str, regApplyNum)
	  res.applyDate = this.getExContent(str, regApplyDate)
	  res.applicant = this.getExContent(str, regApplicant)
	  					.replace(/&ensp;/g, '')
	  					.replace(/<a[\s\S]*<div style="display:none;">/g, '')
	  					.replace('<\/div>', '')
	  res.inventor = this.getExContent(str, regInventor)
	  					.replace(/&ensp;/g, '')
	  					.replace(/<a[\s\S]*<div style="display:none;">/g, '')
	  					.replace('<\/div>', '')
	  res.addr = this.getExContent(str, regAddr)
	  res.clfNum = this.getExContent(str, regClfNum)
	  					.replace(/&ensp;/g, '')
	  					.replace(/&nbsp;/g, '')
	  					.replace(/<a[\s\S]*<div style="display:none;">/g, '')
	  					.replace(/<li>/g, '')
	  					.replace(/<ul>/g, '')
	  					.replace(/<\/li>/g, '')
	  res.sum = this.getExContent(str, regSum)
	  					.replace('<span style="display:none;">', '')

	  

	  dataArr.push(res)

	  this.writeToExcel(this.excelPath, res)
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
 		
  		// 处理验证码逻辑
		this.codeCheck()

		const errStr = html.replace('/get-captcha.jpg', HOST + '/get-captcha.jpg')
							.replace('/verify-captcha.jpg', HOST + '/verify-captcha.jpg')
		throw new Error(errStr)
  	}
  }

  codeCheck() {

  }

  // post 请求
  async post(formData) {
    const ctx = this.ctx;
    const url = POST_URL
    const options = {
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
    }

    const config = {
      headers: {
        'cookie': COOKIE
      },
      timeout: 60*1000*10 //请求超时时间10min
    }

    try {
	    const result = await axios.post(url, querystring.stringify(formData), config);
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

  checkExcelFile() {
  	const ctx = this.ctx
  	const query = ctx.query
  	const strSearch = this.strSearch

  	const pth = path.join(OUTPUT_DIR_PATH, `${strSearch}.xlsx`)

  	try {
  		const res = fs.readFileSync(pth)
  	} catch (e) {
  		
  		this.createExcel(pth)
  	}
  	return pth
  }

  /**
   * [createExcel description]
   * @return {pth} 返回excel表格地址
   */
  createExcel(filePath) {

  	const buffer = xlsx.build([
	  	{name: sheetNameSet['pip'], data: [sheetHead['pip']]},
	  	{name: sheetNameSet['pig'], data: [sheetHead['pig']]}
  	]); // Returns a buffer

  	fs.writeFileSync(filePath, buffer, {'flag':'w'})

  }

  writeToExcel(path, colData) {

    let sheetName
    let sheetData

    if (!this.curSheet || this.curSheet.length == 0) {
    	sheetName = sheetNameSet[this.curSheetSrc]
    	sheetData = [
    		sheetHead[this.curSheetSrc]
    	]
    } else {
    	sheetName = this.curSheet.name
    	sheetData = this.curSheet.data
    }

    const rowCount = sheetData.length - 1

    // 第一行数据为表头
    const firstRowData = sheetData[0]

    // 获取 申请号 column id 索引
    const applyNumIdx = firstRowData.indexOf('申请号');

    let flag = true
    for(let rIdx = 0; rIdx < rowCount; rIdx++) {
      
      let rowData = sheetData[rIdx]
      let applyNum = rowData[applyNumIdx]
      debugger
      if (applyNum != colData['applyNum']) {
      	continue
      } else {
      	flag = false
      	break
      }
    }

    // ['专利标题', '申请公布号', '申请公布日', '申请号', '申请日', '申请人', '发明人', '地址', '分类号', '摘要']
    if (flag) {
    	// 插入数据
    	let data = [
    		colData['h1'],
    		colData['annNum'],
    		colData['annDate'],
    		colData['applyNum'],
    		colData['applyDate'],
    		colData['applicant'],
    		colData['inventor'],
    		colData['addr'],
    		colData['clfNum'],
    		colData['sum']
    	]

    	if (this.isAuthType) {
    		data.push(colData['authDate'])
    		data.push(colData['otherApply'])
    	}

    	sheetData.push(data)

    	this.writeSync(path, {
	    	sheetData,
	    	sheetName
	    })
    }

    return {
    	sheetData,
    	sheetName
    }
  }

  writeSync(filePath, data) {
  	const buffer = xlsx.build([
  	  ...this.workSheets,
      {
          name: data.sheetName,
          data: data.sheetData
      }        
    ]);

    //将文件内容插入新的文件中
    fs.writeFileSync(filePath, buffer, {'flag':'w'});
  }

  updateCookie() {

  }
}

module.exports = PatentSearchController