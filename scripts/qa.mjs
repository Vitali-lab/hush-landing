import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.URL ?? 'http://127.0.0.1:4321/';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--no-first-run'],
});
const errors = [];
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((resolve) => setTimeout(resolve, 140));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 900));

const result = {};

result.images = await page.evaluate(() =>
  Array.from(document.querySelectorAll('img')).map((img) => ({
    src: img.getAttribute('src'),
    ok: img.complete && img.naturalWidth > 0,
    w: img.naturalWidth,
  }))
);

result.anchors = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a[href^="#"]'))
    .map((a) => a.getAttribute('href'))
    .filter((href) => href && href.length > 1 && !document.querySelector(href))
);

result.downloads = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a[href*="Hush-macOS-arm64.dmg"]')).map((a) => ({
    href: a.getAttribute('href'),
    text: (a.textContent ?? '').trim(),
  }))
);

result.headings = await page.evaluate(() =>
  Array.from(document.querySelectorAll('h1,h2,h3')).map((h) => `${h.tagName} ${(h.textContent ?? '').trim().slice(0, 40)}`)
);

// theme switch
await page.$eval('#themes', (el) => el.scrollIntoView({ block: 'start' }));
await new Promise((r) => setTimeout(r, 300));
await page.$eval('[data-theme-picker] [data-theme="midnight"]', (el) => el.click());
await new Promise((r) => setTimeout(r, 450));
result.theme = await page.evaluate(() => ({
  checked: document.querySelector('[data-theme-picker] [data-theme="midnight"]')?.getAttribute('aria-checked'),
  name: document.querySelector('[data-theme-name]')?.textContent,
  active: document.querySelector('.theme-shot.is-active')?.getAttribute('data-theme-image'),
}));
await page.screenshot({ path: 'shots/qa-theme-midnight.png' });

// faq
await page.$eval('#faq-button-1', (el) => el.click());
result.faq = await page.$eval('#faq-button-1', (el) => el.getAttribute('aria-expanded'));

// copy
const context = browser.defaultBrowserContext();
await context.overridePermissions(BASE, ['clipboard-read', 'clipboard-write']);
await page.$eval('[data-copy]', (el) => el.click());
await new Promise((r) => setTimeout(r, 250));
result.copy = await page.$eval('[data-copy-label]', (el) => el.textContent);

// mobile
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await page.click('[data-menu-toggle]');
await new Promise((r) => setTimeout(r, 350));
result.menuOpen = await page.$eval('[data-menu-panel]', (el) => !el.hidden);
await page.screenshot({ path: 'shots/qa-mobile-menu.png' });
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 300));
result.menuClosed = await page.$eval('[data-menu-panel]', (el) => el.hidden);

// responsive overflow + small targets
result.responsive = [];
for (const width of [1440, 1024, 820, 768, 390, 320]) {
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 250));
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
  result.responsive.push({ width, ...sizes, ok: sizes.scroll <= sizes.inner });
}

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await new Promise((r) => setTimeout(r, 250));
result.smallTargets = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a, button, input'))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        text: (el.textContent ?? '').trim().slice(0, 28),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    })
    .filter((x) => x.w > 0 && x.h > 0 && x.h < 44)
);

result.a11y = await page.evaluate(() => {
  const unnamed = Array.from(document.querySelectorAll('button, a')).filter((el) => {
    const text = (el.textContent ?? '').trim();
    const label = el.getAttribute('aria-label') ?? el.getAttribute('title') ?? '';
    return !text && !label;
  }).map((el) => el.outerHTML.slice(0, 100));
  const badAlt = Array.from(document.querySelectorAll('img')).filter((img) => !img.hasAttribute('alt')).length;
  const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  return { unnamed, badAlt, duplicates };
});

result.errors = errors;
console.log(JSON.stringify(result, null, 2));
await browser.close();
