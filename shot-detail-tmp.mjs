const CDP_PORT = 9333;
const BASE = 'http://localhost:3000';

async function newTab(url) {
  const res = await fetch(`http://localhost:${CDP_PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  return res.json();
}
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', reject);
  });
}
function send(ws, method, params = {}) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 1e9);
    const handler = (e) => { const m = JSON.parse(e.data); if (m.id === id) { ws.removeEventListener('message', handler); resolve(m.result); } };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function shootPage(ws, url, outPath) {
  await send(ws, 'Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 3000));
  const heightRes = await send(ws, 'Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
  const fullHeight = Math.min(heightRes.result.value, 6000);
  const shot = await send(ws, 'Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 1280, height: fullHeight, scale: 1 },
  });
  const fs = await import('fs');
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.error('Saved', outPath, `(h=${fullHeight})`);
}

async function main() {
  const tab = await newTab(`${BASE}/admin/analytics`);
  const ws = await connect(tab.webSocketDebuggerUrl);
  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await new Promise((r) => setTimeout(r, 1500));

  await send(ws, 'Runtime.evaluate', {
    expression: `fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'admin',password:'admin123'})}).then(r=>r.json())`,
    awaitPromise: true, returnByValue: true,
  });

  await shootPage(ws, `${BASE}/admin/analytics/abandonment?range=30d`, process.env.TEMP + '/vd-list.png');
  await shootPage(ws, `${BASE}/admin/analytics/abandonment/session/${encodeURIComponent('detailtest-checkout-1')}?range=30d`, process.env.TEMP + '/vd-checkout.png');
  await shootPage(ws, `${BASE}/admin/analytics/abandonment/session/${encodeURIComponent('detailtest-cart-1')}?range=30d`, process.env.TEMP + '/vd-cart.png');
  await shootPage(ws, `${BASE}/admin/analytics/abandonment/session/${encodeURIComponent('nonexistent-session-xyz')}?range=30d`, process.env.TEMP + '/vd-notfound.png');

  await send(ws, 'Target.closeTarget', { targetId: tab.id });
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
