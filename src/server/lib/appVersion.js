const pkg = require('../../../package.json');

function getAppVersion() {
  return pkg.version;
}

module.exports = { getAppVersion };
