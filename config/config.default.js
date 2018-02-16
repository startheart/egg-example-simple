'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1517837016049_8722';

  // add your config here
  config.middleware = [
    'robot'
  ];

  // robot's configurations
  config.robot = {
    ua: [
      /Baiduspider/i,
    ]
  };

  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.tpl': 'nunjucks',
    },
  };

  // 添加 news 的配置项
  config.news = {
    pageSize: 5,
    serverUrl: 'https://hacker-news.firebaseio.com/v0',
  };

  config.security = {
    csrf: false,
  };

  return config;
};
