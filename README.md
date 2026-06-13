# RIVEN — Il quaderno dello strappo

Sito-libro statico: un racconto gotico in undici capitoli, pronto per GitHub Pages.

## Pubblicare su GitHub Pages (5 minuti)

1. Crea un repository nuovo su GitHub (es. `riven`).
2. Carica **il contenuto di questa cartella `sito/`** nella radice del repository
   (index.html deve stare nella radice, non dentro una sottocartella).
3. Su GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root)** → Save.
4. Dopo un minuto il sito è vivo su `https://TUONOME.github.io/riven/`.

## Aggiungere le illustrazioni (le Tavole)

Metti le immagini nella cartella `img/` con i nomi `tavola-01.jpg` … `tavola-11.jpg`
(va bene anche `.png` o `.webp`). L'elenco scene è in `img/LEGGIMI.txt`.
Se un'immagine manca, resta il segnaposto elegante: **niente si rompe mai**.
Formato consigliato: orizzontale 16:10, almeno 1600px di larghezza.

## Modificare il testo

Il testo NON si modifica qui: si modifica nei file `capitolo_*.md` della cartella madre,
poi si rigenera il sito con:

```
python strumenti/build_sito.py
```

e si ricaricano su GitHub i file rigenerati.

## Le due forme

- **Forma normale** — carta cartonata, inchiostro bruno, rubriche rosse da copista.
- **Forma celestiale** — pietra notturna, osso, sigilli viola che brillano.

Il bottone in alto a destra è la trasformazione. La scelta viene ricordata.

## Piccole magie incluse

- **Il fiume**: la riga sottile in alto è il progresso di lettura.
- **Il segnalibro**: il sito ricorda dove sei arrivato; in copertina compare "riprendi la lettura".
- **Frecce ← →** della tastiera per passare tra i capitoli.
- **Stampa / Salva come PDF**: la pagina si ripulisce da sola (niente barre, sfondo bianco).
