'use strict';

const fs = require('fs');
const path = require('path');
const FormStream = require('formstream');
const Controller = require('egg').Controller;

const BASE_PATH = 'http://cx.cnca.cn/rjwcx'

var ak = '302579fc28284373a2dd1c6b82e7ce9a';
var sk = 'abc8d671443846219c4943496395030c';
var apikey = '0d3b0f02fdb03d32d567ca6dfd0593b1';

var ocr = require('baidu-ocr-api').create(ak,sk);
// var ocr = require('baidu-ocr').create(apikey);
// 
let COOKIE = 'Hm_lvt_1ab04bcaf4dd6e15edf78188f2d6a32c=1518495379; JSESSIONID=00001ZTnzHGapts-kvf5otWMxpp:-1; Hm_lpvt_1ab04bcaf4dd6e15edf78188f2d6a32c=1519051754'


var request = require('request-promise');
var axios = require('axios');
var querystring = require('querystring');
var xlsx = require('node-xlsx');

let OUTPUT_FILE_PATH = path.join(__dirname, '../public/test1.xlsx')
let INPUT_FILE_PATH = path.join(__dirname, '../public/data.xlsx')

class DataController extends Controller {
  async home() {
    const ctx = this.ctx;
    const codeurl = `${BASE_PATH}/checkCode/rand.do?d=1518505732259`
    
    await ctx.render('data/code.tpl', { codeurl });
  }

  async getcode() {
    const ctx = this.ctx;
    let url = `${BASE_PATH}/checkCode/rand.do?d=1518505732259`;
    let options = {
        method: 'GET',
        uri: url,
        json: true,
        resolveWithFullResponse: true    //  <---  <---  <---  <---
    };

    let config = {
      // `responseType` indicates the type of data that the server will respond with
  // options are 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
      responseType: 'arraybuffer',
      headers: {
        'cookie': COOKIE
      }
    }

    // const result = await ctx.curl(url);
    // const result = await request(options)
    const result = await axios.get(url, config)
    
    if (result.headers["set-cookie"] && result.headers["set-cookie"][0]) {
      this.updateCookie(result.headers["set-cookie"][0])
    }

    const base64Str = result.data.base64Slice()

    // await this.regImage()
    
    ctx.status = result.status;
    ctx.set(result.headers);
    ctx.body = {
      base64Str
    };
  }

  updateCookie(cookie) {
    COOKIE = cookie
  }

  async getListAndShow() {
    const ctx = this.ctx;

    const certNumber = ctx.query.certNumber
    const code = ctx.query.code

    const list = await this.getList(certNumber, code)
    let ret = {}

    if (list) {
      const rzjgId = list.rzjgId
      const checkC = list.checkC

      const data = await this.getShowData(certNumber, rzjgId, checkC)

      ret = this.getExContent(data)
    }

    ctx.body = ret;
  }

  async getList(certNumber, code) {
    const ctx = this.ctx;
    const url = `${BASE_PATH}/web/cert/list.do?progId=10`
    const options = {
      // 必须指定 method
      method: 'POST',
      // 通过 contentType 告诉 httpclient 以 JSON 格式发送
      contentType: 'json',
      headers: {
        // cookie: ctx.headers.cookie
      },
      data: {
        certNumber: certNumber,
        checkCode: code,
        page: 1,
        rows: 10,
        orgName: ''
      },
      // 明确告诉 httpclient 以 JSON 格式处理响应 body
      dataType: 'json',
    }

    const data = {
      certNumber: certNumber,
      checkCode: code,
      page: 1,
      rows: 10,
      orgName: ''
    }

    const config = {
      headers: {
        'cookie': COOKIE
      }
    }
    
    // const result = await ctx.curl(url, options);
    const result = await axios.post(url, querystring.stringify(data), config);
  
    const res = result.data
    if (res.success) {
      return res.rows && res.rows[0]
    } else {
      return res.msg
    }
  }

  async getShowData(certNumber, rzjgId, checkC) {
    const ctx = this.ctx;
    const url = `${BASE_PATH}/web/cert/show.do?`;
    const options = {
      certNo: certNumber,
      rzjgId,
      checkC
    }

    const data = {
      certNo: certNumber,
      rzjgId,
      checkC
    }

    const config = {
      headers: {
        'cookie': COOKIE
      }
    }

    // const result = await ctx.curl(url, options);
    const result = await axios.post(url, querystring.stringify(data), config);
    
    return result && result.data

  }

  async textHandler(data) {
    // 数据提取 正则匹配
    // 颁证日期 初次获证日期 再认证次数 监督次数
    
  }

  getExContent(content) {
    var ret = {}

    var regAward = /<td>颁证日期<\/td>[.\t\n\r]*<td>(.*)<\/td>/g;
    var regFirst = /<td>初次获证日期<\/td>[.\t\n\r]*<td>(.*)<\/td>/g;
    var regAgain = /<td>再认证次数<\/td>[.\t\n\r]*<td>(.*)<\/td>/g;
    var regWatch = /<td>监督次数<\/td>[.\t\n\r]*<td>(.*)<\/td>/g;
    
    if (regAward.test(content)) {
      ret.award = RegExp.$1
    }

    if (regFirst.test(content)) {
      ret.first = RegExp.$1
    }

    if (regAgain.test(content)) {
      ret.again = RegExp.$1
    }

    if (regWatch.test(content)) {
      ret.watch = RegExp.$1
    }

    return ret
  }

  async handleInFile() {
    // Parse a file
    const workSheetsFromFile = xlsx.parse(OUTPUT_FILE_PATH);

    const sheetCount = workSheetsFromFile.length
    
    if (sheetCount < 1) {
      return null
    }

    // 获取 file 数据
    let datas = []

    const sheet = workSheetsFromFile[0]
    const sheetName = sheet.name
    const sheetData = sheet.data
    const rowCount = sheetData.length
    

    // 第一行数据为表头
    const firstRowData = sheetData[0]
    const columnCount = firstRowData.length

    // 获取 颁证日期 初次获证日期 再认证次数 监督次数 的 id 索引
    const awardIdx = firstRowData.indexOf('颁证日期');
    const firstIdx = firstRowData.indexOf('初次获证日期');
    const againIdx = firstRowData.indexOf('再认证次数');
    const watchIdx = firstRowData.indexOf('监督次数');
    const certNumberIdx = firstRowData.indexOf('证书编号');

    // 用于映射 证书编号 的行标
    let rowRecord = {}

    for(let rIdx = 0; rIdx < rowCount; rIdx++) {
      let data = [];
      let rowData = sheetData[rIdx]
      
      for (let cIdx = 0; cIdx < columnCount; cIdx++) {
        data[cIdx] = rowData[cIdx]
      }

      let certNumber = rowData[certNumberIdx]
      rowRecord[certNumber] = rIdx

      datas[rIdx] = data;

    }

    return {
      datas, // excel 文件结构化
      awardIdx,
      firstIdx,
      againIdx,
      watchIdx,
      rowRecord // 证书编号 映射
    }
  }

  async writeInExcel() {
    const ctx = this.ctx

    const certNumber = ctx.query.certNumber
    const award = ctx.query.award || ''
    const first = ctx.query.first || ''
    const again = ctx.query.again || ''
    const watch = ctx.query.watch || ''

    let fileObj = await this.handleInFile()
    
    let datas = fileObj.datas
    let rowNum = fileObj.rowRecord[certNumber]
    datas[rowNum][fileObj.awardIdx] = award
    datas[rowNum][fileObj.firstIdx] = first
    datas[rowNum][fileObj.againIdx] = again
    datas[rowNum][fileObj.watchIdx] = watch
    
    await this.writeToExcelFile(OUTPUT_FILE_PATH, datas)


    ctx.body = {
      datas
    };
  }

  async getExcelData() {
    // Parse a file
    const workSheetsFromFile = xlsx.parse(OUTPUT_FILE_PATH);

    const sheetCount = workSheetsFromFile.length
    
    if (sheetCount < 1) {
      return null
    }

    // 获取 file 数据
    let datas = []

    const sheet = workSheetsFromFile[0]
    const sheetName = sheet.name
    const sheetData = sheet.data
    const rowCount = sheetData.length
    

    // 第一行数据为表头
    const firstRowData = sheetData[0]
    const columnCount = firstRowData.length

    for(let rIdx = 0; rIdx < rowCount; rIdx++) {
      let data = [];
      let rowData = sheetData[rIdx]
      
      for (let cIdx = 0; cIdx < columnCount; cIdx++) {
        data[cIdx] = rowData[cIdx]
      }

      datas[rIdx] = data;

    }

    this.ctx.body = {
      datas
    };
  }

  async writeToExcelFile(filePath, data) {
    var buffer = xlsx.build([
      {
          name: 'sheet1',
          data: data
      }        
    ]);

    //将文件内容插入新的文件中
    fs.writeFileSync(filePath,buffer,{'flag':'w'});
  }

  async writeToExcelCeil() {

  }

  async regImage() {
    /**

    登陆 百度bcs控制台中心 申请access key
    https://console.bce.baidu.com/iam/#/iam/accesslist

    **/
    // 外部图片
    // var result = await ocr.scan({
    //   url:'http://7pun4e.com1.z0.glb.clouddn.com/test.jpg', // 支持本地路径
    //   type:'text',
    // })
    // const image = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAUAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD2yqGqavZaTDm6vbK3ldWMK3dysKyMO2T25GSAcZ6VfrN1ldYlthDo7WkMknyvczsSYBkfMqBSHON2ASoyBnIzVmBwGjeMLsXes2t3qujyXhZS16+teXb4ZTtFsjRMoCDg5BJb7xPbp/CHiU6jZrZarqOlSaskjRL9kvI5PtSqM+aqqcjIzkYHQnAzgZtuyadZy2GnvL9ilyZRe+G724lnZh87SvlQ5Y5zwOMDoK2PDdtqNjHDBAYpdF8tREJlmgntyqlWUJIGZkLAFdzAqGIGQFpsZt22oWl5PcQ29xHLJbPsmVTko2Oh/wA9QR1BostQtNSgaayuI541dkLIcgMDyP8APUEHoa4bxJpt74g128/sO2kt5LaFobu4ZmiF0SARGB/Fxjk8EEZONpPWeGri2uNCg+yWUllHFmI27oQY2U4YZP3uc89znPORSMIVHKXK/wDhylrV9qhv3hsIbqOC3iDy3CcB2Y4CKphkLkDnK8DJz0rFS+8SC6n8y8uGhCRvGiRnzFDFx8w+yFjzGf4VABHXNbniS6lMIt/7A+2qX+SW4iEsKNsJDbEDucHj7o69RXNNcm0tJhfW0YtbabIju9KlWzkRmBUoAn7llDOMkMSW5LcY5ajalud0EmtjrdFvr54LkanA0MduFZbqaQfvQV3E48uPbtBAOVHOR1Bq1/bmkf8AQUsv/AhP8agsZp77RTGNINixtwscF0EMfK8LhTnaOAQQpx27DI/sPV/+gX4X/wDAd/8ACqlOcUuXUzsm3fQ6uORJY1kjdXRgGVlOQQehBritX8QeLdFitry5sNMeC4uFiW0hMjzgtkhM/dLYGMgHnoDXY2sbxWcEciRI6xqrLCMICByFHp6VzX2Ww1H4hSNc6l9quLGEPDp7wMFtidh3hvusec+vI/ujGzvYKdru6OroooqjMKhuraO8tnglaVUfGTDM0TcHPDIQR07GiigDN/4Rqw/5+NV/8G11/wDHKuWOmQad5nkSXb+ZjP2i7lnxjPTzGOOvbr+FFFAFyiiigBskaTRPFKivG6lWRhkMD1BHcVjt4W0sXME9vE1sYrhbgRwtiIuBtz5ZygOO4AbjIINFFRNJrUqLaZtUUUVZIUUUUAFFFFAH/9k=`
    const image = __dirname + '/001.jpg';
    // ocr.scan( 'LocateRecognize', 'CHN_ENG', 2, image, function( err, data ) {
    //   if ( err ) {
    //     return console.error( err );
    //   }
    //   debugger
    //   console.log( 'words:' );
    //   console.log( data.word );
    // });
    // 外部图片
    
    ocr.scan({
      url: 'http://7xod3k.com1.z0.glb.clouddn.com/mjdalykzuyefpzlgmlnkjizcfcuelxnu', // 支持本地路径
      type: 'text',
    }).then(function (result) {
      debugger
      return console.log(result)
    }).catch(function (err) {
      debugger
      console.log('err', err);
    })
    
  }

  async download() {
    const ctx = this.ctx
    

    const fileName = ctx.query.fileName
    //以文件流的形式下载文件  
    var filePath = path.join(__dirname, '../public/' + fileName)

    ctx.attachment(fileName);

    ctx.set('Content-Type', 'application/octet-stream');
    

    ctx.body = fs.createReadStream(filePath);

  }
}

module.exports = DataController;