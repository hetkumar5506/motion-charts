# Contributing

Thanks for your interest in improving Motion Charts. This guide covers local setup, the quality bar for pull requests, the project's design principles, and the release flow.

## Local setup

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## Quality bar

Run the full validation matrix before opening a pull request or publishing:

```bash
npm run typecheck
npm test
npm run build
npm run verify:package
npm audit --audit-level=high
npm run audit:ponytail
git diff --check
```

`audit:ponytail` is a lightweight internal lint that flags unnecessary abstractions and dependencies that could be replaced with platform APIs.

## Design principles

- Keep charts declarative: consumers pass data and props, and animation happens automatically.
- Prefer SVG and browser APIs over adding a new dependency.
- Type and document every public prop in `packages/charts/README.md`.
- Add tests for reusable math, geometry, theme, and export logic.
- Respect users who prefer reduced motion.
- Favor beautiful defaults over configuration that users must set up themselves.

## Release flow

1. Update `packages/charts/CHANGELOG.md`.
2. Run the quality bar commands above.
3. Verify the docs site manually.
4. Publish from `packages/charts` with `npm publish --access public`.
