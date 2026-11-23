// Builds the static site into docs/ for GitHub Pages (branch: main, folder: /docs).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const env = {
  ...process.env,
  SITE_URL: process.env.SITE_URL ?? 'https://vitali-lab.github.io',
  BASE_PATH: process.env.BASE_PATH ?? '/hush-landing',
};

execFileSync('npm', ['run', 'build'], { stdio: 'inherit', env });
fs.rmSync('docs', { recursive: true, force: true });
fs.cpSync('dist', 'docs', { recursive: true });
fs.writeFileSync('docs/.nojekyll', '');
console.log('docs/ is ready for GitHub Pages');
