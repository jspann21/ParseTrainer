# ParseTrainer

ParseTrainer is a static React + Vite app for Hebrew verb parsing practice.

## Run locally

Prerequisites:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Build production files:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Data

Practice data is stored in `src/data/parsetrainer-data.json`.

Generate the dataset directly from BHSA/ETCBC (pronominal suffix forms are excluded by default):

```bash
pip install text-fabric
python scripts/generate_bhsa_dataset.py
```

To keep pronominal suffix forms in the generated data:

```bash
python scripts/generate_bhsa_dataset.py --include-pronominal-suffixes
```

## GitHub Pages

Deployment is configured in `.github/workflows/pages.yml`.

The Vite base path is set in `vite.config.ts`.

## High Scores

Game Mode high scores are stored per browser in local storage (`parsetrainer:leaderboard:v1`).
Scores are local to the current browser/profile and are not shared globally.

## License

Copyright 2015-present Camil Staps.
Licensed under GPL v3.0.

## Attribution

Data usage:
- [HebrewTools/ParseTrainer](https://github.com/HebrewTools/ParseTrainer)
- [ETCBC/bhsa](https://github.com/ETCBC/bhsa)
