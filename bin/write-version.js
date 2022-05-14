const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const pkgJson = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'),
);

writeFileSync(
  resolve(__dirname, '..', 'src', 'version.ts'),
  `export const version = '${pkgJson.version}'`,
);
