// Copies only the public site into dist/ for Cloudflare Pages.
// Keeps template/, assets-src/, docs, worker/ and other repo files out of the deploy.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');

const entries = [
  'index.html',
  '_headers',
  'assets',
  'admin',
  'capacitaciones',
  'contacto',
  'inspecciones',
  'links',
  'productos',
  'proteccion-incendios',
  'seguridad-industrial',
  'servicios',
];

// Raw data exports that no page loads
const skip = /\.(csv|txt)$/;

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const e of entries) {
  cpSync(join(root, e), join(out, e), { recursive: true, filter: src => !skip.test(src) });
}
console.log(`Built ${entries.length} entries into dist/`);
