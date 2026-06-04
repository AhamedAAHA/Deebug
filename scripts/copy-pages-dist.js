const { cpSync, rmSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const src = join('frontend', 'dist');
const dest = 'dist';

if (!existsSync(src)) {
  console.error(`Build output not found: ${src}`);
  process.exit(1);
}

if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}

cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
