#!/usr/bin/env python3
"""
sincronitza.py — copia els fitxers comuns de step-quiz-commons a un web.

    python3 sincronitza.py WEB CARPETA_DEL_WEB              copia i diu què ha canviat
    python3 sincronitza.py WEB CARPETA_DEL_WEB --comprova   no escriu res; codi 1 si cal canviar algun fitxer
    python3 sincronitza.py --llista                         webs que reben fitxers comuns

Per a cada web, comuns.json diu quins fitxers rep (destí → fitxer de fitxers/) i
amb quina configuració: en els fitxers que en tenen, el text /*@CONFIG*/{} es
substitueix per la configuració d'aquell web en JSON. Només biblioteca estàndard.

GitHub l'executa a cada web cada dia i a mà (workflow «Fitxers comuns»,
.github/workflows/comuns.yml del web).
"""
import json
import os
import sys

ARREL = os.path.dirname(os.path.abspath(__file__))
MARCA = '/*@CONFIG*/{}'


def carrega():
    with open(os.path.join(ARREL, 'comuns.json'), encoding='utf-8') as f:
        return json.load(f)['webs']


def contingut(font, config):
    """Bytes que ha de tenir el fitxer al web."""
    cami = os.path.join(ARREL, 'fitxers', font)
    with open(cami, 'rb') as f:
        dades = f.read()
    if config is None:
        return dades
    text = dades.decode('utf-8')
    if text.count(MARCA) != 1:
        sys.exit(f'{font}: té configuració a comuns.json però no hi ha exactament una marca {MARCA}')
    return text.replace(MARCA, json.dumps(config, ensure_ascii=False)).encode('utf-8')


def sincronitza(web, desti, nomes_comprova=False):
    webs = carrega()
    if web not in webs:
        print(f'{web} no rep cap fitxer comú (no és a comuns.json).')
        return 0
    entrada = webs[web]
    configs = entrada.get('config', {})
    canviats = []
    for cami, font in entrada['fitxers'].items():
        nou = contingut(font, configs.get(font))
        fitxer = os.path.join(desti, cami)
        try:
            with open(fitxer, 'rb') as f:
                actual = f.read()
        except FileNotFoundError:
            actual = None
        if actual == nou:
            continue
        canviats.append(cami)
        if not nomes_comprova:
            os.makedirs(os.path.dirname(fitxer) or '.', exist_ok=True)
            with open(fitxer, 'wb') as f:
                f.write(nou)
    if not canviats:
        print(f'{web}: els {len(entrada["fitxers"])} fitxers comuns ja estan al dia.')
        return 0
    verb = 'cal posar al dia' if nomes_comprova else 'posats al dia'
    print(f'{web}: {len(canviats)} fitxers comuns {verb}:')
    for c in canviats:
        print('  ' + c)
    return 1 if nomes_comprova else 0


def main(args):
    if args[:1] == ['--llista']:
        print('\n'.join(carrega()))
        return 0
    if len(args) < 2 or args[0].startswith('-'):
        print(__doc__)
        return 2
    return sincronitza(args[0], args[1], '--comprova' in args[2:])


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
