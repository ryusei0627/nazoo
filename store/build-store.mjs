// Nazooのストア掲載用スクリーンショット(1290x2796)を生成する。
// 空色グラデ＋サンバースト＋雲＋キラキラの上に、大見出しと傾けた端末モック(実画面)を合成。
// ヘッドレスChromeでHTMLを実寸レンダリング→PNG出力。
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync } from 'fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENS = './store/screens/';
const OUT = './store/out/';
mkdirSync(OUT, { recursive: true });

const C = {
  bgTop: '#AEE3FF',
  bgBot: '#D6F1FF',
  ink: '#3D3A50',
  coral: '#FF6B85',
  teal: '#2DA896',
  grape: '#8E7CE0',
  sun: '#FFC83D',
  sunInk: '#E59A12',
};

// パネル定義：実画面 / 見出し2行 / アクセント色 / 端末の傾き
const PANELS = [
  { shot: 'home.png', l1: 'ひらめき勝負の', l2: 'なぞなぞサバイバル', accent: C.coral, tilt: -3.5 },
  { shot: 'game1.png', l1: '正解するほど', l2: '時間がのびる！', accent: C.teal, tilt: 3.5 },
  { shot: 'game2.png', l1: '知識じゃない、', l2: 'ひらめきで解く。', accent: C.grape, tilt: -3.5 },
  { shot: 'game3.png', l1: 'ひらがなで', l2: 'サクッと回答！', accent: C.sunInk, tilt: 3.5 },
];

const b64 = (p) => 'data:image/png;base64,' + readFileSync(SCREENS + p).toString('base64');

const sunburst = `
<svg class="sun" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g fill="${C.sun}">
    ${Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      const x = 100 + Math.cos(a) * 92, y = 100 + Math.sin(a) * 92;
      return `<rect x="${x - 9}" y="${y - 9}" width="18" height="34" rx="9" transform="rotate(${i * 30} ${x} ${y})"/>`;
    }).join('')}
  </g>
  <circle cx="100" cy="100" r="60" fill="${C.sun}"/>
  <circle cx="100" cy="100" r="60" fill="#fff" opacity="0.18"/>
</svg>`;

const cloud = (cls) => `<div class="cloud ${cls}"></div>`;
const spark = (cls) => `<svg class="spark ${cls}" viewBox="0 0 24 24"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#fff"/></svg>`;

function html(p) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@800;900&display=swap" rel="stylesheet"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:1290px;height:2796px;overflow:hidden;font-family:'M PLUS Rounded 1c',sans-serif;}
  .stage{position:relative;width:1290px;height:2796px;
    background:linear-gradient(180deg,${C.bgTop} 0%,${C.bgBot} 58%,#EAF8FF 100%);overflow:hidden;}
  .sun{position:absolute;width:300px;height:300px;top:-70px;right:-60px;opacity:.9;}
  .cloud{position:absolute;background:#fff;border-radius:100px;opacity:.92;filter:drop-shadow(0 10px 0 rgba(255,255,255,.5));}
  .cloud::before,.cloud::after{content:'';position:absolute;background:#fff;border-radius:50%;}
  .c1{width:240px;height:78px;top:340px;left:-40px;}
  .c1::before{width:120px;height:120px;top:-58px;left:40px;}
  .c1::after{width:90px;height:90px;top:-40px;left:140px;}
  .c2{width:200px;height:66px;top:200px;right:120px;opacity:.8;}
  .c2::before{width:100px;height:100px;top:-48px;left:30px;}
  .c2::after{width:74px;height:74px;top:-30px;left:118px;}
  .c3{width:300px;height:92px;bottom:150px;right:-70px;opacity:.85;}
  .c3::before{width:140px;height:140px;top:-66px;left:48px;}
  .c3::after{width:104px;height:104px;top:-44px;left:170px;}
  .spark{position:absolute;width:46px;height:46px;opacity:.95;filter:drop-shadow(0 4px 6px rgba(61,58,80,.12));}
  .s1{top:520px;left:120px;width:64px;height:64px;}
  .s2{top:300px;right:80px;}
  .s3{top:680px;right:180px;width:34px;height:34px;opacity:.8;}
  .s4{bottom:380px;left:90px;width:54px;height:54px;}

  .head{position:absolute;top:170px;left:0;right:0;text-align:center;z-index:5;padding:0 70px;}
  .head .line{font-weight:900;font-size:128px;line-height:1.16;letter-spacing:-1px;
    text-shadow:
      6px 6px 0 #fff, -6px 6px 0 #fff, 6px -6px 0 #fff, -6px -6px 0 #fff,
      0 6px 0 #fff, 0 -6px 0 #fff, 6px 0 0 #fff, -6px 0 0 #fff,
      0 18px 26px rgba(61,58,80,.16);}
  .l1{color:${C.ink};}
  .l2{color:${p.accent};}

  .ribbon{display:inline-block;margin-top:26px;background:${C.ink};color:#fff;
    font-weight:900;font-size:40px;letter-spacing:2px;padding:14px 40px;border-radius:999px;
    box-shadow:0 8px 0 rgba(61,58,80,.25);}

  .phoneWrap{position:absolute;left:50%;top:1010px;transform:translateX(-50%) rotate(${p.tilt}deg);z-index:3;}
  .phone{width:760px;height:1646px;background:#fff;border-radius:78px;padding:14px;
    box-shadow:0 40px 70px rgba(45,80,110,.28), 0 8px 0 rgba(0,0,0,.04);}
  .phone img{width:100%;height:100%;object-fit:cover;border-radius:62px;display:block;}
  .glow{position:absolute;left:50%;top:1640px;transform:translateX(-50%);width:1000px;height:360px;
    background:radial-gradient(ellipse at center,rgba(255,255,255,.55),rgba(255,255,255,0) 70%);z-index:2;}
</style></head>
<body>
  <div class="stage">
    ${sunburst}
    ${cloud('c1')}${cloud('c2')}${cloud('c3')}
    ${spark('s1')}${spark('s2')}${spark('s3')}${spark('s4')}
    <div class="head">
      <div class="line l1">${p.l1}</div>
      <div class="line l2">${p.l2}</div>
    </div>
    <div class="glow"></div>
    <div class="phoneWrap"><div class="phone"><img src="${b64(p.shot)}"/></div></div>
  </div>
</body></html>`;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1290, height: 2796, deviceScaleFactor: 1 },
});

let i = 0;
for (const p of PANELS) {
  i++;
  const page = await browser.newPage();
  await page.setContent(html(p), { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  await new Promise((r) => setTimeout(r, 400));
  const name = `${String(i).padStart(2, '0')}-${p.shot.replace('.png', '')}.png`;
  await page.screenshot({ path: OUT + name });
  console.log('built', name);
  await page.close();
}
await browser.close();
console.log('done');
