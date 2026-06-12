// 実機解像度(iPhone 6.9" = 1290x2796)でNazooの実画面をキャプチャする。
// ヘッドレスChrome(システムのGoogle Chrome)で localhost:8081 を開き、各画面を撮影。
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = 'http://localhost:8081';
const OUT = './store/screens/';
mkdirSync(OUT, { recursive: true });

// RN-web の Pressable は .click() で反応しないので合成イベントを中心点に dispatch
const TAP = (text) => {
  const els = [...document.querySelectorAll('div,span')].filter(
    (e) => e.textContent === text && e.children.length <= 1
  );
  const el = els[els.length - 1];
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2,
    y = r.top + r.height / 2;
  const t = document.elementFromPoint(x, y) || el;
  ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((type) =>
    t.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }))
  );
  return true;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
  defaultViewport: { width: 430, height: 932, deviceScaleFactor: 3 },
});
const page = await browser.newPage();
await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 90000 });

// フォント＋ホーム描画待ち
await page.waitForFunction(
  () => [...document.querySelectorAll('*')].some((e) => e.textContent === 'スタート！'),
  { timeout: 90000 }
);
await sleep(1200);
await page.screenshot({ path: OUT + 'home.png' });
console.log('captured home');

// ゲーム開始
await page.evaluate(TAP, 'スタート！');
await page.waitForFunction(
  () => [...document.querySelectorAll('*')].some((e) => e.textContent === 'ヒント'),
  { timeout: 30000 }
);
await sleep(1000);
await page.screenshot({ path: OUT + 'game1.png' });
console.log('captured game1');

// 別の問題へ（スキップ）→ 2枚目・3枚目
for (let i = 2; i <= 3; i++) {
  await page.evaluate(TAP, 'スキップ');
  await sleep(900);
  await page.screenshot({ path: OUT + `game${i}.png` });
  console.log('captured game' + i);
}

await browser.close();
console.log('done');
