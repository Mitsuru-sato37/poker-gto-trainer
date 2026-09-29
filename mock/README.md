# MVP mock

Run the interactive mock from the repository root:

```powershell
npm run mock
```

Open <http://127.0.0.1:4173> in a browser. The PWA shell can be installed from a supported browser's "Add to Home screen" command.

## GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. After pushing the repository and enabling GitHub Pages with **GitHub Actions** as the source, the PWA is available at:

`https://mitsuru-sato37.github.io/poker-gto-trainer/`

The path is relative-safe: the manifest, service worker, and assets work when the app is hosted below the domain root.

Most data remains dummy data and is separated in `data/problems.js`; the verified Solver proof node is included from `data/production.js` and labeled in the question view. The mock stores the active session, suspended review session, and answer history in versioned browser `localStorage`; use the browser's site data controls to reset it.

Included modes:

- RANDOM — ten unique questions
- PREFLOP — ten preflop questions
- FLOP+ — ten postflop questions
- PLAY THROUGH — three hands with multiple decisions

Full Range, Custom Training, AI WHY text, backend persistence, and the complete poker engine remain unavailable. Review Mistakes, one verified Solver node, and the PWA shell are available.
