# Contributing

## Local setup

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run dev
```

## Quality bar

Before opening a PR or publishing:

```bash
npm run typecheck
npm run test
npm run build
npm audit
npm run audit:ponytail
```

## Design rules

- Keep charts declarative: users pass data and props, animation happens automatically.
- Prefer SVG and browser APIs before adding dependencies.
- Every public prop should be typed and documented in `packages/charts/README.md`.
- Add tests for reusable math, geometry, theme, and export logic.
- Respect reduced-motion users.
- Prefer beautiful defaults over requiring users to configure everything.

## Release flow

1. Update `packages/charts/CHANGELOG.md`.
2. Run the quality bar commands.
3. Check the docs site manually.
4. Publish from `packages/charts` with `npm publish --access public`.
