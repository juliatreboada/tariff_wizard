# How we work on Tariff Wizard

This document is the **pace agreement** for the project. It stays in git so every session (human or AI) follows the same rules.

## Principles

| Principle | In practice |
|-----------|-------------|
| One concept per step | Few files changed; something runnable in the browser each time. |
| Explain before expand | Each step: **what**, **how** (files + flow), **why** (tradeoff). |
| You try next | After a step ships, you get a small exercise before the next feature. |
| Brake when needed | Big requests (UI + math + PDF + auth) get split; only the first slice ships. |
| Deploy-minded | No secrets in git; `npm run build` must pass before a step is “done”. |

## Session template

1. **Recap** — where we are in the roadmap.
2. **Implement** — small, named diff.
3. **Walkthrough** — server vs client components, which file owns what.
4. **Run** — `npm run dev` and/or `npm run build`.
5. **Your turn** — one small change you make yourself.
6. **Next step preview** — only the immediate next slice.

## Definition of done

- Code runs locally (`npm run dev`).
- Production build succeeds (`npm run build`).
- No private data in committed files.
- Spanish copy lives in `lib/i18n/messages/` (English later via `en.ts`).

## Where code will live (long term)

| Area | Folder | Notes |
|------|--------|--------|
| UI & wizard steps | `components/wizard/` | React; interactive parts use `"use client"`. |
| Copy / i18n | `lib/i18n/messages/` | Plain objects; no i18n library until needed. |
| Types & validation | `lib/tariff/schema.ts` | Zod schemas. |
| Wizard state | `lib/tariff/store.ts` | Zustand. |
| Tariff math & rules | `lib/tariff/` | **Pure TypeScript** — no React imports. Easier to learn and test. |
| Private PDFs | `reference/` | Gitignored; never athlete PII in repo. |
| Your learning notes | `docs/learning/` or `notes/` | Gitignored. |

## When to slow down

If a request bundles too much, we do one of these first:

- Wizard shell before real fields.
- Header block before element rows.
- One sheet type before all categories.
- Local state before login or cloud save.

Say **“go faster”** anytime; default is **understandable steps**.
