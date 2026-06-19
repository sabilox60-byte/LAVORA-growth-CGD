const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:4173/';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');
const REPORT_PATH = path.join(__dirname, 'preview-i18n-report.json');

const viewports = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
];

const whitelist = [
  /^CGD$/,
  /^EN$/,
  /^Clinic Growth Department/i,
  /^\[[A-Z0-9_ .-]+\]$/,
  /^[A-Z]{3,4}$/,
  /^https?:\/\//i,
  /^www\./i,
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  /^[+0-9 ()-]{7,}$/,
];

function allowedLatin(text) {
  return whitelist.some((pattern) => pattern.test(text));
}

async function collectVisibleLatin(page) {
  return page.evaluate(({ whitelistPatterns }) => {
    const patterns = whitelistPatterns.map((source) => new RegExp(source.source, source.flags));
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = (node.nodeValue || '').replace(/\s+/g, ' ').trim();
      if (!value) continue;
      const parent = node.parentElement;
      if (!parent || !isVisible(parent)) continue;
      const tokens = value.match(/[A-Za-z][A-Za-z0-9&+.'’:/_-]*/g) || [];
      for (const token of tokens) {
        if (patterns.some((pattern) => pattern.test(token))) continue;
        hits.push({ token, context: value.slice(0, 180) });
      }
    }
    return hits;
  }, {
    whitelistPatterns: whitelist.map((pattern) => ({ source: pattern.source, flags: pattern.flags })),
  });
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const lang of ['en', 'ar']) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: lang === 'ar' ? 'ar-SA' : 'en-US',
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}?lang=${lang}`, { waitUntil: 'networkidle' });

      const metrics = await page.evaluate(() => {
        const hero = document.querySelector('.hero-title-v8');
        const partnership = document.querySelector('#selective-partnership');
        const heroRect = hero?.getBoundingClientRect() || null;
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          viewport: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          heroText: hero?.innerText || '',
          heroRect,
          partnershipProofs: partnership?.querySelectorAll('.partnership-proof-grid span').length || 0,
          partnershipCurrencyRows: partnership?.querySelectorAll('.currency-row').length || 0,
          partnershipDeadSelectors: partnership?.querySelectorAll('.currency,.coverage-selector,[data-tier]').length || 0,
        };
      });

      const screenshotPath = path.join(OUTPUT_DIR, `${lang}-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      let latinLeaks = [];
      if (lang === 'ar') latinLeaks = await collectVisibleLatin(page);

      results.push({
        lang,
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        screenshot: screenshotPath,
        ...metrics,
        latinLeaks: latinLeaks.slice(0, 40),
      });

      await context.close();
    }
  }

  await browser.close();
  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));
  console.log(REPORT_PATH);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
