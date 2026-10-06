// 使い方マニュアル(public/guide.html)用スクリーンショットを撮り直す。
//   1. 別ターミナルで `npm run dev` を起動しておく
//   2. `npm run guide-shots` （URL を変えるなら: npm run guide-shots -- http://localhost:5173/）
// Chrome をヘッドレスで起動し、DevTools Protocol で操作しながら public/guide/*.png を上書きする。
// Chrome の場所は環境変数 CHROME_PATH で上書き可能。
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP_URL = process.argv[2] ?? 'http://localhost:5173/';
const OUT_DIR = new URL('../public/guide/', import.meta.url);
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9339;
const W = 390, H = 844; // iPhone 相当

const sleep = ms => new Promise(r => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), 'yc-move-shots-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

try {
  let targets;
  for (let i = 0; i < 40 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); }
  }
  if (!targets) throw new Error('Chrome に接続できません（CHROME_PATH を確認）');

  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0;
  const send = (method, params = {}) => new Promise((res, rej) => {
    const my = ++id;
    ws.addEventListener('message', function h(ev) {
      const m = JSON.parse(ev.data);
      if (m.id !== my) return;
      ws.removeEventListener('message', h);
      if (m.error) rej(new Error(`${method}: ${JSON.stringify(m.error)}`)); else res(m.result);
    });
    ws.send(JSON.stringify({ id: my, method, params }));
  });
  // 下書き再開などの確認ダイアログは「キャンセル」で閉じる
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: false });
  });
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });

  const go = async (url) => { await send('Page.navigate', { url }); await sleep(1500); };
  const shot = async (name, clip) => {
    const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    writeFileSync(new URL(`${name}.png`, OUT_DIR), Buffer.from(r.data, 'base64'));
    console.log('saved', `public/guide/${name}.png`);
  };
  const mouse = (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  const tap = async (x, y) => { await mouse('mousePressed', x, y); await sleep(30); await mouse('mouseReleased', x, y); await sleep(250); };
  const drag = async (x, y, dx, dy) => {
    await mouse('mousePressed', x, y);
    for (let i = 1; i <= 15; i++) { await mouse('mouseMoved', x + dx * i / 15, y + dy * i / 15); await sleep(16); }
    await sleep(300); // 浮き上がりアニメーションの完了を待つ
    await mouse('mouseReleased', x + dx, y + dy); await sleep(300);
  };
  const center = (expr) => evalJs(`(() => { const e = ${expr}; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const labelPos = (label) => center(`[...document.querySelectorAll('svg text')].find(t => t.textContent === ${JSON.stringify(label)})`);
  const btnPos = (m) => center(`[...document.querySelectorAll('button')].find(b => b.title === ${JSON.stringify(m)} || b.textContent.trim() === ${JSON.stringify(m)})`);
  const tapBtn = async (m) => {
    const p = await btnPos(m);
    if (!p) throw new Error(`ボタンが見つかりません: ${m}`);
    await tap(p.x, p.y);
  };
  const isSelected = () => evalJs(`[...document.querySelectorAll('button')].some(b => b.title === 'このフレームでボールを保持' && getComputedStyle(b).visibility === 'visible')`);

  // 下書きの無いまっさらな状態から始める
  await go(APP_URL);
  await evalJs('localStorage.clear(); true');
  await go(APP_URL);

  const bottomTop = await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'f1').getBoundingClientRect().top - 3`);
  const BOTTOM = { x: 0, y: bottomTop, width: W, height: H - bottomTop };

  // 1. 初期画面と操作エリア
  await shot('01-editor');
  await shot('02-bottom', BOTTOM);

  // 2. 追加モード
  await tapBtn('+A');
  await shot('03-add-mode', BOTTOM);
  await tapBtn('+A');

  // 3. プレイヤー選択
  let p = await labelPos('A1');
  await tap(p.x, p.y);
  await shot('04-selected', BOTTOM);
  await tap(p.x, p.y);

  // 4. f2 を追加して前進させ、ボールを A2 へ
  await tapBtn('＋');
  for (const [label, dy] of [['A2', -60], ['A3', -60], ['A4', -40], ['D2', 15], ['D3', 15], ['D4', 10]]) {
    p = await labelPos(label);
    await drag(p.x, p.y, 0, dy);
    if (await isSelected()) { const q = await labelPos(label); await tap(q.x, q.y); }
  }
  p = await labelPos('A2');
  await tap(p.x, p.y);
  await tapBtn('このフレームでボールを保持');
  await shot('05-frame2');
  await tap(p.x, p.y);

  // 5. スクロールモード
  await tapBtn('▲▼');
  await shot('06-scroll');
  await tapBtn('▲▼');

  // 6. 共有 → 閲覧画面
  await evalJs(`navigator.clipboard.writeText = async (t) => { window.__shared = t; }; window.alert = () => {}; true`);
  await tapBtn('🔗');
  await sleep(300);
  const shared = await evalJs('window.__shared');
  if (!shared) throw new Error('共有URLを取得できません');
  await go('about:blank');
  await go(shared);
  await shot('07-viewer');

  ws.close();
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
