const fs = require('fs');
const path = require('path');

let cachedAssets = null;

function getViteAssets() {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  if (cachedAssets) {
    return cachedAssets;
  }

  const manifestPath = path.join(__dirname, '../../../dist/.vite/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entry = manifest['index.html'];
  if (!entry || !entry.file) {
    return null;
  }

  cachedAssets = {
    js: `/${entry.file}`,
    css: (entry.css || []).map((file) => `/${file}`),
  };

  return cachedAssets;
}

module.exports = { getViteAssets };
