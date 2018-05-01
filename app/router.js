'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
// app/router.js
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/news', controller.news.list);
  router.get('/get', 'httpclient.get');
  router.get('/post', 'httpclient.post');
  router.get('/put', 'httpclient.put');
  router.get('/delete', 'httpclient.del');
  router.get('/form', 'httpclient.form');
  router.get('/multipart', 'httpclient.multipart');
  router.get('/stream', 'httpclient.stream');
  router.post('/stream', 'httpclient.postStream');
  router.get('/error', 'httpclient.error');
  router.get('/data', 'data.home');
  router.get('/getcode', 'data.getcode');
  router.get('/getListAndShow', 'data.getListAndShow');
  router.get('/getExcelData', 'data.getExcelData');
  router.get('/writeInExcel', 'data.writeInExcel');
  router.get('/download', 'data.download');
  router.get('/patentSearch', 'patentSearch.home');
};

