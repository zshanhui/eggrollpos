#!/usr/bin/env node
/**
 * Bump deploy version by 0.1.0 (minor segment) before pushing a new build.
 * Example: 0.1.0 -> 0.2.0 -> 0.3.0
 */

const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const parts = pkg.version.split('.').map((n) => parseInt(n, 10));
if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
  console.error(`Invalid version in package.json: ${pkg.version}`);
  process.exit(1);
}

const [major, minor] = parts;
const nextVersion = `${major}.${minor + 1}.0`;
const previousVersion = pkg.version;

pkg.version = nextVersion;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`Deploy version bumped: ${previousVersion} -> ${nextVersion}`);
