# Lumo – Aventura Săritoare

Platformer 2D pentru mobil, în stil clasic de aventură cu sărituri. Personaj, lumi și grafică originale,
desenate integral din cod (Canvas), fără asset-uri externe. HTML5 + JavaScript vanilla, fără build.

**Joacă aici:** https://andrei0182.github.io/Mario/

## Cum se joacă

Ghidează-l pe **Lumo** prin trei lumi: *Pajiștea Însorită*, *Peștera de Cristal* și *Cetatea din Nori*.
Adună monede, sari pe inamici (Bumbo și Zumzi) și atinge steagul de la final înainte să expire timpul.

| Acțiune  | Telefon (landscape)              | PC              |
|----------|----------------------------------|-----------------|
| Mers     | butoanele ◀ ▶ (stânga-jos)       | ← → sau A / D   |
| Săritură | butonul ⤒ (dreapta-jos)          | Spațiu / ↑ / W  |
| Pauză    | butonul ⏸ (sus)                  | P / Esc         |
| Sunet    | butonul 🔊 (sus-dreapta)         | M               |

- Ține apăsat butonul de săritură ca să sari mai sus; o atingere scurtă = săritură mică.
- Lovește de jos blocurile aurii (monede) și cărămizile (se sparg).
- Evită țepii și prăpăstiile. Ai 3 vieți; la fiecare 50 de monede primești o viață în plus.
- Steagurile mici sunt puncte de control. Cel mai bun scor se salvează local.

## Instalare pe telefon (PWA)

Deschide link-ul în Chrome (Android) sau Safari (iOS) → meniu → **Adaugă pe ecranul principal**.
Jocul rulează apoi pe tot ecranul și funcționează offline.

## Rulare locală

```sh
python3 -m http.server 8000   # apoi deschide http://localhost:8000
```

Adaugă `?fps` la URL pentru contorul de FPS.

## Structură

- `index.html` – pagina, meta viewport, înregistrarea service worker-ului
- `style.css` – ecran complet, fără scroll/zoom, overlay pentru orientare
- `game.js` – motorul jocului, nivelele (array `LEVELS`), grafică, input, audio
- `manifest.json`, `sw.js`, `icon-*.png` – PWA / offline
