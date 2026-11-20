import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.URL ?? 'http://127.0.0.1:4321/';
const width = Number(process.env.W ?? 1440);
const height = Number(process.env.H ?? 1000);
const tag = process.env.TAG ?? String(width);
const reduced = process.env.MOTION !== 'on';
const outDir = path.resolve('shots');
await fs.mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--no-first-run'],
});

const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
if (reduced) {
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
}
await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  window.scrollTo(0, 0);
});
await new Promise((resolve) => setTimeout(resolve, 700));

await page.screenshot({ path: path.join(outDir, `${tag}-hero.png`) });
await page.screenshot({ path: path.join(outDir, `${tag}-full.png`), fullPage: true });

const sections = [
  ['app-strip', '.app-strip'],
  ['everywhere', '#features'],
  ['privacy', '#privacy'],
  ['speed', '#speed'],
  ['shortcut', '#shortcuts'],
  ['themes', '#themes'],
  ['install', '#install'],
  ['faq', '#faq'],
  ['cta', '.cta-section'],
  ['footer', '.site-footer'],
];

for (const [name, selector] of sections) {
  const element = await page.$(selector);
  if (!element) continue;
  await element.screenshot({ path: path.join(outDir, `${tag}-${name}.png`) });
}

const errors = await page.evaluate(() =>
  Array.from(document.querySelectorAll('img')).filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src)
);
if (errors.length) console.log('Broken images:', errors);

const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  bodyWidth: document.body.scrollWidth,
}));
console.log(JSON.stringify({ width, overflow }, null, 2));

await browser.close();
