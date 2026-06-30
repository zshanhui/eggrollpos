var express = require('express');
var router = express.Router();
var { getViteAssets } = require('../lib/viteAssets');
var { getAppVersion } = require('../lib/appVersion');

function getPublicSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    publishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  };
}

/* GET home page. */
router.get('/{*splat}', function(req, res, next) {
  res.render('index', {
    currentUser: null,
    pageTitle: 'eggroll pos demo',
    pageDescription: 'Description...',
    serverData: {
      appVersion: getAppVersion(),
      supabase: getPublicSupabaseConfig(),
    },
    viteAssets: getViteAssets(),
  });
});

module.exports = router;
