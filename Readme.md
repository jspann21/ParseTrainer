# ParseTrainer

ParseTrainer is now a static React app (Vite) that practices Hebrew verb parsing using fixed data snapshots.

## Run locally

Prerequisites:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Run development server:

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

## Data source and export

The app reads from `src/data/parsetrainer-data.json`.

To export a fresh snapshot from ParseTrainer database tables:

```bash
php artisan trainer:export-static-data --out=src/data/parsetrainer-data.json
```

The JSON contract includes:

- `meta`
- `stems`
- `tenses`
- `rootKinds`
- `roots`
- `verbs`

## GitHub Pages

The project includes `.github/workflows/pages.yml` to build and deploy `dist/`.

`vite.config.ts` is configured with project-pages base path:

- `/ParseTrainer/`

## License

Copyright 2015-present Camil Staps.
Licensed under GPL v3.0.
