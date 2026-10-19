# Auditoria d'accessibilitat dels webs de l'alumnat — octubre de 2026

Punt 100 de la llista de millores. Webs: operacions, a, cb, repas, geom, inaba, cangurcat, pau, sol,
pi, karelcat, karelcat-p, pycat, jscat, htmlcat i ggcat.

## Com s'ha fet

- **axe-core 4.10** dins de Chromium (Playwright), amb les regles WCAG 2.1 A i AA i les de bones
  pràctiques, a **153 pàgines**: totes les activitats d'operacions, a i inaba, i una mostra de cada
  tipus de pàgina a la resta (portada, índex del curs, un capítol, un repte, l'editor, la pàgina
  d'una tasca…). Els webs que tenen tema fosc (geom, pau, pi, karelcat, karelcat-p, htmlcat) s'han
  passat també en fosc.
- **Teclat:** cada element que es pot tabular ha de canviar d'aspecte quan rep el focus, i tot el
  que es pot clicar s'ha de poder fer servir sense ratolí.
- **Lectors de pantalla:** noms accessibles (botons, camps, marcs, barres de progrés), rols i
  etiquetes ARIA, i el que el navegador exposa de debò a l'arbre d'accessibilitat.

Per tornar-ho a passar, l'eina és [`eines/auditoria-a11y.mjs`](../eines/auditoria-a11y.mjs):

```
npm install --no-save playwright axe-core
npx playwright install chromium          # només la primera vegada
node eines/auditoria-a11y.mjs ../repas index.html "practica.html?full=1"
node eines/auditoria-a11y.mjs ../geom index.html sol.html --fosc
```

Surt amb error si troba alguna violació greu o crítica; amb `--tot` ensenya també les moderades.

## Què s'ha trobat i s'ha arreglat

Abans hi havia violacions greus o crítiques a **15 dels 16 webs** (repas ja estava net, gràcies
a `tests/test_a11y.js`). Després: **cap**, llevat de les tres excepcions de més avall.

| Problema | On | Arreglat |
|---|---|---|
| **Contrast del text** per sota de 4,5:1 (sobretot grisos `#64748b`, `#6b7280` i `#8C887E` sobre fons tenyits, i colors d'accent com `#3b82f6` o `#059669` fent de text o de fons de botó blanc) | operacions, a, cb, geom, inaba, pau, sol, pi, karelcat, karelcat-p, pycat, jscat, ggcat | el to s'ha enfosquit (o aclarit, en fosc) el mínim per arribar a 4,5:1 |
| **No es podia fer servir amb teclat**: targetes de categoria i llistes d'exercicis fetes amb `<div>`/`<li>` i `onclick` | pau, sol | ara reben el focus i s'obren amb Enter (i espai) |
| **L'editor de codi no mostrava el focus** (textarea transparent amb `outline: none`) | karelcat, karelcat-p, pycat, jscat, htmlcat | contorn visible amb el tabulador |
| **Botons sense nom**: les opcions de resposta escrites amb KaTeX (el lector de pantalla deia «botó» i prou) | operacions (probabilitat, derivades, asímptotes, integrals) | `aria-label` amb la fórmula llegida en català (`texAText` a `js/utils.js`) |
| **Camps sense etiqueta** | operacions (complexos, esglaonar matriu, estadística, rectes i plans), cb, cangurcat | `aria-label` o `<label for>` |
| **Marcs sense títol** (l'editor incrustat als capítols) | pycat, jscat | `title` a l'iframe |
| **No es podia fer zoom** (`maximum-scale=1.0`) | karelcat, karelcat-p (simulador) | tret |
| **Enllaç de llicència sense nom** si no carrega la imatge | pau, sol (78 pàgines) | `aria-label` a l'enllaç |
| **ARIA mal fet als fitxers comuns**: el projecte actual del selector EXPLORA (`aria-label` en un `<span>` sense rol) i la barra de progrés del certificat sense nom | `family.js`, `certificat.js` (aquí) | `role="img"` i `aria-label` |

Els dos últims arriben als webs amb la sincronització diària, quan aquest repositori està al dia.

## Excepcions que es mantenen a posta

- **a, `album.html`**: les paraules encara no descobertes tenen la imatge atenuada. És una
  decoració (`aria-hidden`) que indica un estat inactiu, i el que es llegeix és el text del costat.
- **operacions, `complexos.html` i `equacions.html`**: els passos que encara no toquen i el camp de
  resposta un cop respost són elements inactius; les WCAG no hi demanen contrast.
- **htmlcat**: el requadre «Codi net» és un `<aside>` dins del `<main>`. axe ho marca com a bona
  pràctica (moderat), però HTMLCat ensenya HTML semàntic i aquest és l'ús correcte de l'element.

## Pendent (moderat, no és un incompliment WCAG)

- **101 pàgines sense `<main>`** i 7 sense `<h1>` (sobretot operacions, a, pi i les pàgines de les
  solucions de sol i geom). Els lectors de pantalla s'hi poden moure igualment per encapçalaments,
  però amb `<main>` hi saltarien d'un sol cop. Tocar l'estructura de tantes pàgines demana anar web
  per web i comprovar que el CSS (`body > div`…) no se'n ressent.
- Algunes fitxes imprimibles (pi, `operacions/s.html`) tenen capçaleres de taula buides i salts de
  nivell d'encapçalament.
