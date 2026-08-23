import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outPath = path.join(root, "output", "seqvio-youtube-thumbnail.png");
const markPath = path.join(root, "docs", "assets", "brand", "seqvio-mark.svg");
const mark = fs.readFileSync(markPath, "utf8").replace(/<\?xml[^>]*>/g, "");
const assetRoot = path.join(root, "docs", "assets", "brand", "agent-icons");
const assetData = (name, mime) =>
  `data:${mime};base64,${fs.readFileSync(path.join(assetRoot, name)).toString("base64")}`;
const cursorLogo = assetData("cursor.svg", "image/svg+xml");
const claudeLogo = assetData("claude-code.svg", "image/svg+xml");
const chatgptLogo = assetData("chatgpt.svg", "image/svg+xml");
const hermesLogo = assetData("hermes-banner.png", "image/png");

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; }
html, body { margin: 0; width: 1280px; height: 720px; overflow: hidden; }
body {
  font-family: Inter, Arial, Helvetica, sans-serif;
  color: #f4f8fc;
  background: #07111f;
}
.frame { position: relative; width: 1280px; height: 720px; overflow: hidden; }
.grid {
  position: absolute; inset: 0; opacity: .23;
  background-image: linear-gradient(rgba(118, 174, 220, .10) 1px, transparent 1px), linear-gradient(90deg, rgba(118, 174, 220, .10) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(90deg, rgba(0,0,0,.72), transparent 94%);
}
.wash { position:absolute; left: -100px; top: -120px; width: 760px; height: 760px; border-radius: 50%; background: rgba(57, 145, 224, .10); filter: blur(40px); }
.eyebrow { position:absolute; left: 74px; top: 58px; color:#73d8f5; font-size: 20px; font-weight: 700; letter-spacing: 3px; }
.title { position:absolute; left: 70px; top: 156px; width: 520px; font-size: 74px; line-height: 1.02; letter-spacing: -2px; font-weight: 800; }
.title .accent { color: #72d8f5; }
.agent-row { position:absolute; left: 74px; top: 360px; display:flex; gap:24px; }
.agent-badge { display:flex; align-items:center; justify-content:center; width:64px; height:64px; padding:7px; border:0; border-radius:0; background:transparent; box-shadow:none; }
.agent-icon { display:block; width:48px; height:48px; object-fit:contain; border-radius:10px; background:#f4f7fa; }
.claude-icon { object-fit:cover; object-position:left center; background:#0e0e0e; }
.hermes-icon { width:50px; height:44px; object-fit:cover; object-position:left center; background:#151515; }
.subtitle { position:absolute; left: 75px; top: 540px; color:#b9c9d8; font-size: 20px; letter-spacing: .2px; }
.logo { position:absolute; left: 74px; bottom: 43px; width: 68px; height: 68px; }
.brand { position:absolute; left: 158px; bottom: 56px; font-size: 32px; font-weight: 700; letter-spacing: -.5px; }
.pill { position:absolute; right: 68px; top: 54px; border: 1px solid rgba(114,216,245,.42); color:#9ee7f7; padding: 10px 16px; border-radius: 99px; font-size: 14px; font-weight: 700; letter-spacing: 2px; }
.stage { position:absolute; right: 30px; top: 136px; width: 638px; height: 454px; }
.path { position:absolute; left: 38px; right: 42px; top: 228px; height: 5px; background: linear-gradient(90deg, #72d8f5, #5b7cf1, #55d6a6); border-radius:4px; box-shadow: 0 0 18px rgba(114,216,245,.5); }
.node { position:absolute; width: 174px; height: 150px; border: 2px solid; border-radius: 22px; background: rgba(12, 28, 48, .94); box-shadow: 0 18px 32px rgba(0,0,0,.22); }
.node:after { display:none; }
.node .dot { position:absolute; left:20px; top:20px; width:12px; height:12px; border-radius:50%; }
.node .label { position:absolute; left:20px; top:47px; font-size:18px; font-weight:700; }
.command { position:absolute; left:20px; top:82px; color:#9ee7f7; font: 13px Consolas, monospace; white-space:nowrap; }
.prompt { color:#55d6a6; }
.file { position:absolute; left:20px; top:81px; color:#c9c3ff; font: 13px Consolas, monospace; }
.file:after { content:"story beats  ·  timing"; display:block; margin-top:8px; color:#8193a6; }
.browser-bar { position:absolute; left:16px; right:16px; top:78px; height:27px; border-radius:7px; background:#10263d; }
.browser-bar:before { content:"skillbench.dev"; position:absolute; left:10px; top:7px; color:#9fb3c5; font: 11px Consolas, monospace; }
.check { position:absolute; left:20px; top:118px; width:15px; height:15px; border:2px solid #55d6a6; border-radius:50%; }
.check:after { content:""; position:absolute; left:3px; top:0px; width:4px; height:7px; border-right:2px solid #55d6a6; border-bottom:2px solid #55d6a6; transform:rotate(40deg); }
.result { position:absolute; left:43px; top:119px; color:#9ee7c9; font-size:13px; font-weight:700; }
.terminal { left: 0; top: 144px; border-color:#72d8f5; }
.terminal .dot { background:#72d8f5; }
.page { left: 160px; top: 24px; border-color:#8b86f4; }
.page .dot { background:#8b86f4; }
.evidence { left: 320px; top: 202px; border-color:#55d6a6; }
.evidence .dot { background:#55d6a6; }
.evidence .label { left:20px; font-size:15px; white-space:nowrap; }
.play { left: 488px; top: 60px; width: 146px; height: 146px; border-color:#f2bb63; border-radius: 36px; }
.play .dot { background:#f2bb63; }
.play:before { content:""; position:absolute; left:59px; top:48px; border-left: 38px solid #f2bb63; border-top: 25px solid transparent; border-bottom: 25px solid transparent; }
.play:after { display:none; }
.caption { position:absolute; font-size:15px; color:#9fb3c5; letter-spacing: 1px; text-transform:uppercase; }
.c1 { left: 17px; top: 315px; } .c2 { left: 190px; top: 194px; } .c3 { left: 338px; top: 372px; } .c4 { right: 0; top: 258px; }
.spark { position:absolute; width:9px; height:9px; border-radius:50%; background:#72d8f5; box-shadow: 0 0 18px currentColor; }
.s1 { left: 154px; top: 104px; color:#72d8f5; } .s2 { left: 394px; top: 106px; color:#55d6a6; } .s3 { left: 502px; top: 336px; color:#f2bb63; }
</style></head><body><div class="frame">
<div class="grid"></div><div class="wash"></div>
<div class="title"><span class="accent">Make agent</span><br>work visible</div>
<div class="agent-row">
  <div class="agent-badge"><img class="agent-icon" src="${cursorLogo}" alt=""></div>
  <div class="agent-badge"><img class="agent-icon claude-icon" src="${claudeLogo}" alt=""></div>
  <div class="agent-badge"><img class="agent-icon" src="${chatgptLogo}" alt=""></div>
  <div class="agent-badge"><img class="agent-icon hermes-icon" src="${hermesLogo}" alt=""></div>
</div>
<div class="stage"><div class="path"></div>
  <div class="node terminal"><div class="dot"></div><div class="label">Terminal</div><div class="command"><span class="prompt">$</span> seqvio capture</div></div>
  <div class="node page"><div class="dot"></div><div class="label">Explainer plan</div><div class="file">editorial.md</div></div>
  <div class="node evidence"><div class="dot"></div><div class="label">Browser evidence</div><div class="browser-bar"></div><div class="check"></div><div class="result">PASS</div></div>
  <div class="node play"><div class="dot"></div></div>
  <div class="caption c1">capture</div><div class="caption c2">shape</div><div class="caption c3">verify</div><div class="caption c4">explain</div>
  <div class="spark s1"></div><div class="spark s2"></div><div class="spark s3"></div>
</div>
<img class="logo" src="data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}"><div class="brand">Seqvio</div>
</div></body></html>`;

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle0" });
await new Promise((resolve) => setTimeout(resolve, 500));
await page.screenshot({ path: outPath, type: "png" });
await browser.close();
console.log(outPath);
