// tests/prova.mjs — comprova els fitxers comuns tal com els rebrà cada web.
//
// Ús:  npm install --no-save jsdom   (només la primera vegada)
//      node tests/prova.mjs
//
// Per a cada web de comuns.json genera els fitxers (amb sincronitza.py, en una
// carpeta temporal) i els executa en un navegador simulat (jsdom):
//   · family.js  → selector amb les 4 icones, el projecte actual sense enllaç,
//                  i els punts de tall de la configuració d'aquell web;
//   · footer.js  → peu amb la classe del web, fix o no segons la configuració;
//   · progress.js → desa, no desgrava mai i fa servir la clau del web;
//   · kbd-accessory.js → en pantalla tàctil hi ha una tecla per entrada i
//                  escriuen a l'editor; amb ratolí no surt res.
//   · certificat.js → amb capítols pendents diu quants en falten; amb tots
//                  superats mostra el certificat amb el nom i l'enllaç al curs
//                  següent (o el final de la sèrie, a JSCat).
// També comprova que tots els fitxers de comuns.json existeixen.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ARREL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const COMUNS = JSON.parse(fs.readFileSync(path.join(ARREL, 'comuns.json'), 'utf8')).webs;
let errors = 0, oks = 0;
const ok = (cond, msg) => { if (cond) oks++; else { errors++; console.log('  ✗ ' + msg); } };

function dom(html, { url = 'https://exemple.step-quiz.net/index.html', tactil = false } = {}) {
  const d = new JSDOM(`<!doctype html><html><head></head><body>${html}</body></html>`, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  d.window.matchMedia = q => ({ matches: tactil ? /coarse|hover: none/.test(q) : /hover: hover/.test(q), addEventListener() {} });
  if (!tactil) delete d.window.ontouchstart;   // jsdom el defineix sempre; un ordinador amb ratolí no
  return d;
}
const executa = (d, codi) => d.window.eval(codi);

for (const [web, def] of Object.entries(COMUNS)) {
  console.log(`· ${web}`);
  for (const font of new Set(Object.values(def.fitxers)))
    ok(fs.existsSync(path.join(ARREL, 'fitxers', font)), `${web}: falta fitxers/${font}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'comuns-'));
  execFileSync('python3', [path.join(ARREL, 'sincronitza.py'), web, tmp], { stdio: 'pipe' });
  const cfg = def.config || {};
  const desti = font => Object.entries(def.fitxers).find(([, f]) => f === font)?.[0];
  const codi = font => fs.readFileSync(path.join(tmp, desti(font)), 'utf8');

  if (desti('family.js')) {
    const c = cfg['family.js'];
    const d = dom('<header class="topbar"><div class="topbar-actions"><button id="b">x</button></div></header>');
    executa(d, codi('family.js'));
    const nav = d.window.document.querySelector('.cat-family');
    ok(nav, `${web}: family.js no crea el selector`);
    if (nav) {
      ok(nav.querySelectorAll('.cat-family-item').length === 4, `${web}: family.js no té 4 icones`);
      const cur = nav.querySelector('.is-current');
      ok(cur && cur.tagName === 'SPAN' && cur.querySelector('img').src.endsWith(`img/${c.actual}.svg`), `${web}: el projecte actual no és ${c.actual} o és un enllaç`);
      ok(nav.querySelectorAll('a.cat-family-item').length === 3, `${web}: family.js hauria de tenir 3 enllaços`);
      const css = [...d.window.document.querySelectorAll('style')].map(s => s.textContent).join('\n');
      ok(css.includes(`min-width: ${c.centraDesDe || 720}px`), `${web}: falta el punt de tall centraDesDe`);
      ok(css.includes(`max-width: ${c.amagaNomSota || 500}px`), `${web}: falta el punt de tall amagaNomSota`);
      ok(!!c.amagaTotSota === css.includes(`max-width: ${c.amagaTotSota}px`), `${web}: amagaTotSota mal aplicat`);
      const host = d.window.document.querySelector('.topbar-actions');
      ok((c.posicio === 'inici') === (host.firstElementChild === nav), `${web}: posició del selector incorrecta`);
    }
    const e = dom('<div class="topbar-actions"></div>', { url: 'https://x.step-quiz.net/curs/capitol-1.html?embed=1' });
    executa(e, codi('family.js'));
    ok(!e.window.document.querySelector('.cat-family'), `${web}: family.js no s'hauria de mostrar en mode embed`);
  }

  if (desti('footer.js')) {
    const c = cfg['footer.js'];
    const d = dom('<main class="main"></main>', { url: 'https://x.step-quiz.net/curs/capitol-1.html' });
    executa(d, codi('footer.js'));
    const f = d.window.document.querySelector('footer');
    ok(f && f.className === c.classe, `${web}: el peu no té la classe ${c.classe}`);
    ok(f && f.querySelector('a[href="../LICENSE"]'), `${web}: dins de curs/, l'enllaç a la llicència ha de ser ../LICENSE`);
    const css = d.window.document.querySelector('style').textContent;
    ok(css.includes('position: fixed') === !!c.fix, `${web}: el peu hauria de ser ${c.fix ? '' : 'no '}fix`);
  }

  if (desti('progress.js')) {
    const c = cfg['progress.js'];
    // La clau no es pot canviar mai: l'alumnat perdria tot el progrés desat.
    const CLAUS = { pycat: 'pycat_progress', jscat: 'jscat_progress', ggcat: 'geocat_progress' };
    ok(!CLAUS[web] || c.clau === CLAUS[web], `${web}: la clau de progrés ha de ser ${CLAUS[web]} (si canvia, es perd el progrés desat)`);
    const d = dom('', { url: 'https://x.step-quiz.net/curs/capitol-1.html' });
    d.window.localStorage.setItem(c.clau, JSON.stringify({ 'cap-1': true }));
    executa(d, codi('progress.js'));
    const w = d.window;
    ok(w.isGoalCompleted('cap-1'), `${web}: no llegeix el progrés ja desat (clau ${c.clau})`);
    w.saveGoalCompleted('cap-2');
    ok(JSON.parse(w.localStorage.getItem(c.clau))['cap-2'] === true, `${web}: no desa a la clau ${c.clau}`);
    ok(!w.isGoalCompleted('cap-9') && !w.isGoalCompleted(''), `${web}: dona per superat el que no ho és`);
    w.localStorage.setItem(c.clau, 'no és JSON');
    ok(Object.keys(w.getProgress()).length === 0, `${web}: no resisteix dades malmeses`);
  }

  if (desti('kbd-accessory.js')) {
    const c = cfg['kbd-accessory.js'];
    const html = '<main class="main"><div class="editor-wrap"><textarea id="code-editor">x</textarea></div></main>';
    const api = c.api ? `window.${c.api} = { editText(ta, t) { const s = ta.selectionStart; ta.value = ta.value.slice(0, s) + t + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + t.length; }, indentSelection(ta) { ta.value = '    ' + ta.value; }, dedentSelection() {} };` : '';
    const d = dom(html, { tactil: true });
    if (c.disposicio === 'fixa') d.window.ontouchstart = null;
    executa(d, api + codi('kbd-accessory.js'));
    const btns = d.window.document.querySelectorAll('.kbd-bar__btn');
    ok(btns.length === c.tecles.filter(k => k !== null).length, `${web}: la barra hauria de tenir ${c.tecles.filter(k => k !== null).length} tecles i en té ${btns.length}`);
    const ta = d.window.document.getElementById('code-editor');
    ta.setSelectionRange(1, 1);
    const primera = c.tecles.find(k => typeof k === 'string');
    [...btns].find(b => b.textContent === primera)?.click();
    ok(ta.value === 'x' + primera, `${web}: la tecla «${primera}» no escriu a l'editor (${JSON.stringify(ta.value)})`);
    const bar = d.window.document.querySelector('.kbd-bar');
    ok(bar && bar.classList.contains('kbd-bar--' + c.disposicio), `${web}: disposició ${c.disposicio} no aplicada`);
    if (c.disposicio === 'sota') ok(bar.previousElementSibling && bar.previousElementSibling.classList.contains('editor-wrap'), `${web}: la barra hauria d'anar just sota l'editor`);
    const r = dom(html, { tactil: false });
    executa(r, api + codi('kbd-accessory.js'));
    ok(!r.window.document.querySelector('.kbd-bar'), `${web}: amb ratolí no hi hauria d'haver barra`);
  }
  if (desti('certificat.js')) {
    const c = cfg['certificat.js'];
    // Un curs de mentida: 4 capítols (el 4t, extra si finsCapitol < 4) i 2 reptes
    const N = Math.min(3, c.finsCapitol);
    const caps = [1, 2, 3, 4].map(n => ({ num: n, titol: 'Capítol ' + n, arxiu: `capitol-${n}.html`, goalId: `cap-${n}-ex` }));
    caps.forEach(x => { if (x.num > N) x.num = c.finsCapitol + 1; });
    const reptes = [{ num: 1, titol: 'R1', arxiu: 'repte-1.html', goalId: 'repte-1', mons: 3 }, { num: 2, titol: 'R2', arxiu: 'repte-2.html', goalId: 'repte-2', mons: 3 }];
    const prepara = (fets, reptesFets) => {
      const d = dom('<section id="certificat"></section>');
      const dades = `window.CAPITOLS_DATA = ${JSON.stringify(caps)}; window.REPTES_DATA = ${JSON.stringify(reptes)};`;
      const prog = c.progres === 'karel'
        ? `window.KProgress = { exerciciSuperat: n => ${JSON.stringify(fets)}.includes(n), estatRepte: n => ({ complet: ${JSON.stringify(reptesFets)}.includes(n) }) };`
        : `function getProgress() { const p = {}; ${JSON.stringify(fets)}.forEach(n => p['cap-' + n + '-ex'] = true); ${JSON.stringify(reptesFets)}.forEach(n => p['repte-' + n] = true); return p; }`;
      executa(d, dades + prog + codi('certificat.js'));
      return d.window.document;
    };
    let doc = prepara([1], []);
    const sec = doc.getElementById('certificat');
    ok(/1 de 3 capítols superats/.test(sec.textContent), `${web}: certificat.js no diu «1 de 3 capítols superats» (${sec.textContent.slice(0, 120)})`);
    ok(sec.querySelectorAll('.cert-falten a').length === 2 && !sec.querySelector('.cert-paper'), `${web}: amb capítols pendents no ha de sortir el certificat`);
    doc = prepara([1, 2, 3], [2]);
    const paper = doc.querySelector('.cert-paper');
    ok(paper && paper.textContent.includes(c.curs), `${web}: amb tots els capítols superats hauria de sortir el certificat de ${c.curs}`);
    if (paper) {
      const input = doc.querySelector('.cert-nom');
      input.value = 'Ada Lovelace'; input.dispatchEvent(new doc.defaultView.Event('input'));
      ok(doc.querySelector('.cert-paper-nom').textContent === 'Ada Lovelace', `${web}: el nom no surt al certificat`);
      ok(doc.defaultView.localStorage.getItem(c.clauNom) === 'Ada Lovelace', `${web}: el nom no es desa a ${c.clauNom}`);
      ok(!!c.reptes === /Reptes superats: 1 de 2/.test(paper.textContent), `${web}: el recompte de reptes no és el que diu la configuració`);
      const seg = doc.querySelector('.cert-seguent');
      if (c.seguent) ok(seg && seg.getAttribute('href') === c.seguent.url && seg.textContent.includes(c.seguent.nom), `${web}: falta l'enllaç a ${c.seguent.nom}`);
      else ok(!seg && /KarelCat → PyCat → JSCat/.test(doc.getElementById('certificat').textContent), `${web}: l'últim curs de la sèrie no ha d'enllaçar cap altre curs`);
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

// La cadena de cursos és KarelCat → PyCat → JSCat (l'HTML va a part)
const cadena = Object.entries(COMUNS).filter(([, d]) => d.config?.['certificat.js']).map(([w, d]) => [w, d.config['certificat.js'].seguent?.nom || null]);
ok(JSON.stringify(cadena) === JSON.stringify([['karelcat', 'PyCat'], ['pycat', 'JSCat'], ['jscat', null]]), `la cadena de certificats hauria de ser KarelCat → PyCat → JSCat (és ${JSON.stringify(cadena)})`);

console.log(errors ? `\n✗ ${errors} errors (${oks} comprovacions correctes)` : `\n✓ Tot correcte: ${oks} comprovacions.`);
process.exit(errors ? 1 : 0);
