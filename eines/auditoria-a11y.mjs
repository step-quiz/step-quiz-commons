// ════════════════════════════════════════════════════════════════════
// eines/auditoria-a11y.mjs — Auditoria d'accessibilitat d'un web de Step Quiz
//
//   node eines/auditoria-a11y.mjs CARPETA_DEL_WEB pàgina.html [pàgina2.html …]
//        [--fosc] [--tot]
//
// Serveix la carpeta en local, obre cada pàgina amb Chromium (Playwright) i hi
// passa axe-core amb les regles WCAG 2.1 A i AA i les de bones pràctiques.
// També prova el teclat: cada element que es pot tabular ha de canviar d'aspecte
// quan té el focus.
//
//   --fosc   la pàgina es veu amb el tema fosc del sistema (prefers-color-scheme)
//   --tot    mostra també les regles moderades i menors (sense --tot, només
//            les greus i crítiques, que són les que fallen WCAG)
//
// Surt amb codi 1 si hi ha alguna violació greu o crítica.
//
// Cal Playwright i axe-core (no són dependències dels webs, només d'aquesta eina):
//   npm install --no-save playwright axe-core
//   npx playwright install chromium        (només la primera vegada)
//
// Les peticions a altres dominis es tallen: així el resultat no depèn de la
// xarxa, i una pàgina que no funciona sense CDN es veu de seguida.
// Docs: docs/auditoria-accessibilitat-2026-10.md
// ════════════════════════════════════════════════════════════════════
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opcions = new Set(args.filter(a => a.startsWith('--')));
const [carpeta, ...pagines] = args.filter(a => !a.startsWith('--'));
if (!carpeta || !pagines.length) {
  console.error('Ús: node eines/auditoria-a11y.mjs CARPETA pàgina.html [...] [--fosc] [--tot]');
  process.exit(2);
}
const require = createRequire(import.meta.url);
let chromium, axeFont;
try {
  ({ chromium } = require('playwright'));
  axeFont = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
} catch {
  console.error('Falten Playwright o axe-core: npm install --no-save playwright axe-core');
  process.exit(2);
}

const TIPUS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf' };
const arrel = path.resolve(carpeta);
const servidor = http.createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta.endsWith('/')) ruta += 'index.html';
  const fitxer = path.join(arrel, ruta);
  if (!fitxer.startsWith(arrel) || !fs.existsSync(fitxer) || fs.statSync(fitxer).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': TIPUS[path.extname(fitxer)] || 'application/octet-stream' });
  fs.createReadStream(fitxer).pipe(res);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const port = servidor.address().port;

const executable = process.env.CHROMIUM_PATH || undefined;
const navegador = await chromium.launch(executable ? { executablePath: executable } : {});
const context = await navegador.newContext({ viewport: { width: 1280, height: 900 },
  colorScheme: opcions.has('--fosc') ? 'dark' : 'light' });
await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());

let greus = 0;
for (const pagina of pagines) {
  const p = await context.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/${pagina}`, { waitUntil: 'load' }).catch(e => errors.push(e.message));
  await p.waitForTimeout(1200);
  await p.addScriptTag({ content: axeFont });
  const violacions = await p.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
      rules: { region: { enabled: false } },
    });
    return r.violations.map(v => ({ id: v.id, impacte: v.impact, ajuda: v.help, n: v.nodes.length,
      on: v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' — ' + (n.failureSummary || '').split('\n')[1]) }));
  });
  // Teclat: amb el focus, l'element ha de canviar d'aspecte. Les transicions
  // es treuen perquè el valor calculat sigui el final.
  const senseFocus = await p.evaluate(() => {
    const s = document.createElement('style');
    s.textContent = '*{transition:none!important;animation:none!important}';
    document.head.append(s);
    const sel = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,' +
      '[tabindex]:not([tabindex="-1"]),summary';
    const visible = e => e.getClientRects().length && !e.closest('details:not([open]) > :not(summary)');
    const props = e => { const c = getComputedStyle(e);
      return [c.outlineStyle, c.outlineWidth, c.boxShadow, c.backgroundColor, c.borderColor, c.textDecorationLine].join('|'); };
    const out = [];
    for (const e of [...document.querySelectorAll(sel)].filter(visible).slice(0, 60)) {
      if (document.activeElement) document.activeElement.blur();
      const abans = props(e);
      e.focus({ focusVisible: true });
      if (props(e) === abans) out.push(e.outerHTML.slice(0, 90));
    }
    return out;
  });
  const mostrar = violacions.filter(v => opcions.has('--tot') || v.impacte === 'serious' || v.impacte === 'critical');
  greus += violacions.filter(v => v.impacte === 'serious' || v.impacte === 'critical').length;
  console.log(`\n${pagina}${errors.length ? '  (errors JS: ' + errors.slice(0, 2).join(' · ') + ')' : ''}`);
  if (!mostrar.length && !senseFocus.length) console.log('  ✓ cap problema');
  for (const v of mostrar) {
    console.log(`  ✗ [${v.impacte}] ${v.id} ×${v.n}: ${v.ajuda}`);
    for (const o of v.on) console.log(`      ${o}`);
  }
  for (const h of senseFocus) console.log(`  ⚠ teclat: no canvia en rebre el focus: ${h}`);
  await p.close();
}
await navegador.close();
servidor.close();
console.log(greus ? `\n✗ ${greus} violacions greus o crítiques.` : '\n✓ Cap violació greu ni crítica.');
process.exit(greus ? 1 : 0);
