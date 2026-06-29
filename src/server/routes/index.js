var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/{*splat}', function(req, res, next) {
  res.render('index', {
    currentUser: null,
    pageTitle: 'eggroll pos demo',
    pageDescription: 'Description...',
    serverData: {
      foo: 'bar',
    }
  });
});

module.exports = router;
