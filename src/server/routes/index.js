var express = require('express');
var router = express.Router();
var { getViteAssets } = require('../lib/viteAssets');

/* GET home page. */
router.get('/{*splat}', function(req, res, next) {
  res.render('index', {
    currentUser: null,
    pageTitle: 'eggroll pos demo',
    pageDescription: 'Description...',
    serverData: {
      foo: 'bar',
    },
    viteAssets: getViteAssets(),
  });
});

module.exports = router;
