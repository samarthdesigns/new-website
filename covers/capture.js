// usage: node cap.js <id> <out> [stills t1,t2..]  — needs local server on 8766
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
(async () => {
  const [id, out, stills] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:8766/covers/cover.html?id=${id}&cap`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const el = await p.$('#cv');
  if (stills) {
    for (const t of stills.split(',')) { await p.evaluate(t => __render(t), +t); await el.screenshot({ path: `${out}-${t}.png` }); }
  } else {
    const fps = 30, L = await p.evaluate(() => __loop), dir = `/tmp/covercap/f-${id}`;
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    for (let i = 0; i < L * fps; i++) { await p.evaluate(t => __render(t), i / fps); await el.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.png` }); }
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', `${dir}/%04d.png`, '-c:v', 'libopenh264', '-b:v', '1400k', '-g', '240', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', `${out}.mp4`]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', `${dir}/%04d.png`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-an', `${out}.webm`]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${dir}/${String(Math.round(L * fps * .62)).padStart(4, '0')}.png`, '-q:v', '82', `${out}.webp`]);
  }
  console.log(id, errs.length ? 'ERR ' + errs.join(' | ') : 'ok');
  await b.close();
})();
