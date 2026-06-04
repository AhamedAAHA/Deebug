import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', '@mlightcad', 'libredwg-web', 'wasm', 'libredwg-web.wasm');
const destDir = join(root, 'public', 'libredwg');
const dest = join(destDir, 'libredwg-web.wasm');

if (!existsSync(src)) {
  console.warn('[copy-libredwg-wasm] WASM not found — run npm install first');
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log('[copy-libredwg-wasm] Copied libredwg-web.wasm to public/libredwg/');
