# Rendiment en Chromebooks i mòbils — octubre de 2026

Punt 101 de la llista de millores. Webs: operacions, repas, geom, cb, pau, sol i cangurcat.

Mesurat amb Chromium en mode mòbil (390 × 844, densitat 2): el que baixa una pàgina en obrir-se, sense
comprimir (Cloudflare envia l'HTML, el CSS i el JavaScript comprimits, unes tres o quatre vegades més
petits; les imatges, no).

## Canvis

| Web | Què | Abans → després |
|---|---|---|
| **pau**, **sol** | La icona de la capçalera era una imatge de 1536 × 1024 (208 kB) per ensenyar-la a 47 px. Ara és de 144 × 96. | 208 → 8 kB a **cada pàgina** (portada de pau: 248 → 48 kB; una pàgina de solucions de sol: 236 → 36 kB) |
| **repas** | `full.html` (la pàgina d'un full) carregava el banc sencer del full i KaTeX per pintar els blocs i el mapa. Ara carrega només l'índex (títols i ids), i res d'aquella pàgina no és LaTeX. | Full 1: 666 → 160 kB |
| **repas** | (Fase G) `practica.html` carrega només el bloc de l'exercici | Full 1: 737 → 557 kB |
| **cb** | Les 302 imatges de les preguntes, comprimides sense cap pèrdua (oxipng; els mateixos píxels, comprovat un per un). Eina: `eines/optimitza_png.py`. | `data/`: 34 → 18 MB; cada pregunta, uns 50 kB menys |
| **sol** | La mateixa eina per a les imatges del solucionari (146 MB), per passar-la des d'un Codespace (el ZIP no hi cabria). A les pàgines de solució, la segona imatge i les següents es baixen quan s'hi arriba (`loading="lazy"`). | Previst: −20 a −25 % |
| **operacions** | KaTeX és en una carpeta amb la versió al nom: `_headers` diu a Cloudflare que el navegador el pot guardar un any. | Cap baixada ni validació de KaTeX en canviar d'activitat |

## Revisat i sense canvis

- **geom**: les figures ja passen per `optimitza_png.py` a cada pujada (cap PNG més per comprimir);
  les solucions ja fan servir `loading="lazy"`. La portada carrega 25 scripts (814 kB sense
  comprimir, ~200 kB comprimits) al final del `<body>`, i no bloquegen el primer pintat.
- **cangurcat**: una imatge per problema (~64 kB, JPEG); comprimir-les sense pèrdua només en treu un 4 %.
- **operacions**: entre 60 i 150 kB per activitat; les que fan servir KaTeX, uns 580 kB (KaTeX en
  són 270, que amb `_headers` només es baixen un cop).
- **cb**, `test.html`: 250 kB, i una sola imatge per pregunta.

## Pendent

- **KaTeX sota demanda** a repas (`practica.html`, 270 kB): és el que queda per baixar dels 250 kB
  que es va fixar com a objectiu (repas, `docs/TODO-AI.md` §4).
- **sol**: passar `eines/optimitza_png.py` des d'un Codespace.
