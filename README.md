# step-quiz-commons

Els fitxers que comparteixen els cursos de programació de Step Quiz (KarelCat, KarelCat-P,
PyCat, JSCat, HTMLCat i GeoCat). Cada fitxer és aquí **una sola vegada**: els webs en tenen una
còpia que es posa al dia sola. Així, per exemple, canviar el text del peu de pàgina és un sol
canvi en lloc de cinc.

## Què hi ha

| Fitxer (a `fitxers/`) | Què és | El reben |
|---|---|---|
| `LICENSE`, `LLICENCIA.md` | Llicència (contingut CC BY-NC-SA 4.0, codi MIT) | tots sis |
| `img/*.svg` | Icones de la família (selector «EXPLORA») | karelcat, pycat, jscat, htmlcat |
| `family.js` | Selector «EXPLORA» dels projectes germans | karelcat, pycat, jscat |
| `footer.js` | Peu de pàgina (autoria i llicència) | karelcat, karelcat-p, pycat, jscat |
| `kbd-accessory.js` | Barra de tecles per a pantalles tàctils | karelcat, karelcat-p, pycat, jscat |
| `progress.js` | Exercicis i reptes superats (localStorage) | pycat, jscat, ggcat |

[`comuns.json`](comuns.json) diu, per a cada web, **quins fitxers rep, on van i amb quina
configuració**. Allà hi ha tot el que és diferent d'un web a l'altre: quin és el projecte
actual del selector, si el peu és fix, quines tecles té la barra, la clau del progrés…

## Com arriben als webs

Cada web té el workflow `.github/workflows/comuns.yml` (plantilla a
[`plantilles/comuns.yml`](plantilles/comuns.yml)). Cada dia, i també a mà, baixa aquest
repositori, executa `sincronitza.py` i, si algun fitxer ha canviat, en fa un commit (Cloudflare
el publica) i llança les comprovacions del web.

Als webs, aquests fitxers porten a dalt «FITXER COMÚ… No l'editis aquí». Si s'hi editen, el
canvi es perd l'endemà.

## Canviar un fitxer comú

1. Edita'l aquí: el fitxer de `fitxers/` si el canvi és per a tots els webs, o `comuns.json` si és
   només per a un.
2. Passa les proves (vegeu més avall). GitHub les passa soles a cada canvi (pestanya Actions,
   «Tests»).
3. Els webs se l'emporten l'endemà de matinada. Si el vols veure ja en un web: al repositori
   d'aquell web, **Actions → «Fitxers comuns» → Run workflow → Run workflow**.

## Afegir un web nou (p. ex. un curs nou de la família)

1. Afegeix-lo a `comuns.json`, amb els fitxers que rep i la seva configuració.
2. Si ha de sortir al selector «EXPLORA», afegeix-lo a `CAT_PROJECTS` de `fitxers/family.js` i la
   seva icona a `fitxers/img/`. (HTMLCat té el seu propi `family.js`, amb mòduls ES:
   `site/js/family/family.js`; cal afegir-l'hi també.)
3. Copia `plantilles/comuns.yml` a `.github/workflows/comuns.yml` del web nou.

## Proves

```
npm install --no-save jsdom      # només la primera vegada
node tests/prova.mjs
```

Per a cada web, genera els fitxers tal com els rebrà i els executa en un navegador simulat:
el selector té les quatre icones i els punts de tall del web, el peu és fix o no, el progrés es
desa amb la clau de sempre (si canviés, l'alumnat el perdria) i la barra de tecles escriu a
l'editor.

Per comprovar a mà si un web està al dia, des d'una carpeta on hi hagi tots dos repositoris:

```
python3 step-quiz-commons/sincronitza.py pycat pycat --comprova
```

## Què no és aquí, i per què

- **El progrés de KarelCat i KarelCat-P** (`curs/progress.js`, `KProgress`): desa també
  l'empremta del codi de cada món dels reptes, una cosa que els altres cursos no tenen.
- **HTMLCat** fa servir mòduls ES i té les seves pròpies regles (sense variables globals, estils a
  fitxers CSS, tipografies servides des del mateix web): només en rep la llicència i les icones.
