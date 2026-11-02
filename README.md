# Tariff Wizard

Asistente para crear **hojas de tarifa** de gimnasia acrobática.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Comenzar asistente** to open the wizard shell at `/wizard`.

## Project docs

- [How we work](docs/HOW-WE-WORK.md) — pace, teaching, definition of done
- [Context](docs/CONTEXT.md) — users, header fields, pair-first scope
- [Field labels](docs/FIELD-LABELS.md) — exact labels from BASE.xls
- [Level & category](docs/LEVEL-AND-CATEGORY.md) — two-part level, category rules, VALUE rows
- [UX direction](docs/UX.md) — wizard steps, layout, calculated fields
- [Step 2 prerequisites](docs/STEP-2-PREREQUISITES.md) — before the first real form
- [Element catalog](docs/CATALOG.md) — FGX Balance (`catalog/FGX/manifest.json`)
- [Print / PDF](docs/PRINT.md) — export via browser print
- [Rulesets](docs/RULESETS.md) — competition rules as config; how to add a level

```bash
npm run validate-catalog   # check manifest.json ↔ image files
npm test                   # rule and store tests (Vitest)
```

## Private reference material

Put official PDFs and sample sheets in `reference/` on your machine (gitignored). See [reference/README.example.md](reference/README.example.md).

## Deploy

Hosted on [Vercel](https://vercel.com), connected to this GitHub repo: pushes to `main` deploy to production, other branches get preview URLs.

- The build command lives in [`vercel.json`](vercel.json) and runs the tests and catalog check before `next build`, so a failing test blocks the deploy.
- Run `npm test && npm run build` locally before pushing.
- Add secrets in the Vercel dashboard only (never commit `.env.local`).

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, Vitest. Form/state libraries (`zod`, `react-hook-form`, `zustand`) are installed for Step 2 onward.
