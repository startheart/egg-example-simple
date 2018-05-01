<!-- app/view/news/list.tpl -->
<html>
  <head>
    <title>Hacker News</title>
    <!-- <link rel="stylesheet" href="/public/css/news.css" /> -->
  </head>
  <body>
    <div id="list_form" class="news-view view" style="
        margin: 20px auto;
        width: 100%;
        text-align: center;
    ">
      <div style="display: flex;justify-content: center;">
        <span>
          证件编号：
        </span>
        <input name="certNumber" id="list_certNumber" type="text" style="width: 23%;" placeholder="请输入准确的证书编号" >
      </div>

      <div style="display: flex;justify-content: center;margin-top: 10px;">
        <span>
          验证码：
        </span>
        <input id="qrcode" type="text" name="checkCode" style="width: 127px;" placeholder="请输入阿拉伯数字">

        <span id="checkCodeImgNew" onclick="changeValidateCode()" style="width: 120px; display: inline-block;    background-repeat: no-repeat;background-position: center center; color:orange">
          点击获取验证码
        </span>
        
      </div>

      <div style="margin-top: 10px;">
        <button style="background-color:orange" onclick="submit()">获取数据</button>
      </div>

      <div style="margin-top: 10px;">
        结果如下：
      </div>

      <div style="margin-top: 10px;">
        <table id="cert_info" style="border: 1px solid #0094ff;margin: 0 auto;" border="1">
          <tbody>
          <tr>        
            <td class="text_label_1">颁证日期</td>
            <td id="award"></td>       
          </tr>
          <tr>
            <td class="text_label">初次获证日期</td>
            <td id="first"></td>
          </tr>
          <tr>
            <td class="text_label">再认证次数</td>
            <td id="again"></td>
          </tr>
          <tr>
            <td class="text_label">监督次数</td>
            <td id="watch"></td>
          </tr> 
        </tbody>
        </table>
      </div>

      <div id="excel-table">
        <div>
          excel 表格数据
        </div>
        <table id="cert_info" style="border: 1px solid #0094ff;margin: 0 auto;" border="1">
          <tbody>

          </tbody>
        </table>
      </div>
      
    </div>
    <script type="text/javascript" src="http://cx.cnca.cn/rjwcx/jslib/easyui1.4/jquery.min.js"></script>
    <script type="text/javascript">
      function basePath() {
        return 'http://cx.cnca.cn/rjwcx';
      }
      //高级查询的验证码
      function changeValidateCode(){
        
        var url = `/getcode?`

        $.ajax({
          type: "GET",
          url: url,
          dataType: "json",
          success: function(data){
            
            console.info('success', data)
            $('#checkCodeImgNew').html('')

            var imgUrl = 'data:image/jpeg;base64,' + data.base64Str

            $('#checkCodeImgNew').css({
              backgroundImage: `url(${imgUrl})`
            })
          },
          error: function(err) {
            console.error('err', err)
          }
        })

      }

      function submit() {
        var certNumber = $('#list_certNumber').val()
        var code = $('#qrcode').val()

        var url = `/getListAndShow?certNumber=${certNumber}&code=${code}`

        $.ajax({
          type: "GET",
          url: url,
          dataType: "json",
          success: function(data){
            var $award = $('#award')
            var $first = $('#first')
            var $again = $('#again')
            var $watch = $('#watch')

            var award = data.award || ''
            var first = data.first || ''
            var again = data.again || ''
            var watch = data.watch || ''

            $award.html(award)
            $first.html(first)
            $again.html(again)
            $watch.html(watch)

            

            writeInExcel(certNumber, {
              award: award,
              first: first,
              again: again,
              watch: watch
            })
            
            console.info('success', data)
          },
          error: function(err) {
            console.error('err', err)
          },
          complete: function() {
            // 重置验证码
            changeValidateCode()
          }
        })
      }

      function writeInExcel(certNumber, data) {
        var award = data.award || ''
        var first = data.first || ''
        var again = data.again || ''
        var watch = data.watch || ''
        var url = `/writeInExcel?certNumber=${certNumber}&award=${award}&first=${first}&again=${again}&watch=${watch}`

        $.ajax({
          type: "GET",
          url: url,
          dataType: "json",
          success: function(res){
            
            
          },
          error: function(err) {
            console.error('err', err)
          },
          complete: function() {
            // 重置验证码
            getExcelData()
          }
        })
      }

      getExcelData()

      function getExcelData() {
        var url = `/getExcelData`

        $.ajax({
          type: "GET",
          url: url,
          dataType: "json",
          success: function(res){
            if (!res.datas) {
              return
            }


            // 组合html 模板
            var html = genTpl(res.datas)
            $('#excel-table tbody').html(html)
            
          },
          error: function(err) {
            console.error('err', err)
          },
          complete: function() {
            // 重置验证码
            
          }
        })
      }

      function genTpl(datas) {
        var rowCount = datas.length
        var columnCount = datas[0].length

        var tplArr = []

        for(var rIdx = 0; rIdx < rowCount; rIdx++) {
          var rowHeadStr = `<tr>\n`

          tplArr.push(rowHeadStr)

          var data = [];
          var rowData = datas[rIdx]
          
          for (var cIdx = 0; cIdx < columnCount; cIdx++) {
            var val = rowData[cIdx]
            
            tplArr.push(`<td class="text_label">${val?val:''}</td>\n`)
          }

          var rowTailStr = `</tr>\n`

          tplArr.push(rowTailStr)

        }

        return tplArr.join('')
      }
    </script>
  </body>
</html>
