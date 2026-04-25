# Contributing to MarkHome

MarkHome is a small text standard for simple 2D home layout diagrams.

## Principles

- Keep the language readable in plain text.
- Prefer tiny, composable syntax additions.
- Preserve deterministic parsing and SVG rendering.
- Avoid CAD, BIM, 3D, marketplace, and photorealistic design scope.

## Local Development

```bash
corepack pnpm install
corepack pnpm check
corepack pnpm build
corepack pnpm dev
```

## Language Changes

Changes to syntax should update:

- `SPEC.md`
- parser tests or parser examples
- renderer behavior when applicable
- README examples

## Pull Requests

Keep PRs focused. A parser change, renderer change, docs change, or integration change should usually be separate unless they are required for one feature.
