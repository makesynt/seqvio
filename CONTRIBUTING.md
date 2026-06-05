# Contributing

Thanks for contributing to Seqvio.

## Before You Start

- Use Node.js `>=18`.
- Use `pnpm >=8` as the canonical package manager for this repo.
- Read [README.md](./README.md) for current scope and [docs/COMPOSITION-AUTHORING.md](./docs/COMPOSITION-AUTHORING.md) for the active authoring contract.

## Local Setup

```bash
pnpm install
pnpm build
```

Useful validation commands:

```bash
pnpm --filter @seqvio/renderer run render:smoke
pnpm --filter @seqvio/renderer run render:composition-smoke
pnpm --filter @seqvio/renderer run render:multiscene-smoke
pnpm --filter @seqvio/renderer run render:caption-smoke
```

## Contribution Guidelines

- Keep docs aligned with current code, not planning docs.
- Separate current behavior from proposals and roadmap notes.
- Prefer small, reviewable pull requests.
- Update examples or docs when changing public APIs or workflows.
- Do not commit secrets, generated local `.env` files, or machine-specific output.

## Pull Requests

Include:

- a short description of the change
- why the change is needed
- validation performed
- screenshots or render outputs when the change affects visuals

## Documentation Rules

- Treat code, examples, and `docs/COMPOSITION-AUTHORING.md` as implementation truth.
- Mark speculative material clearly and keep it under `docs/proposals/` or other non-current locations.
- Prefer fixing or removing stale docs over leaving conflicting guidance in place.

## Publishing to npm

Publishable packages:

- `@seqvio/whiteboard`
- `@seqvio/core`
- `@seqvio/renderer`

The root `seqvio` package is private and is not published.

Release flow:

```bash
pnpm install
pnpm build
pnpm changeset          # record semver intent for changed packages
pnpm version            # bump versions and changelogs
npm login               # once per machine, or use NPM_TOKEN in CI
pnpm release            # build + publish via changesets
```

Before the first publish:

1. Create the `@seqvio` npm organization (or confirm scope ownership).
2. Ensure each package has `publishConfig.access: "public"`.
3. Validate tarballs locally:

```bash
pnpm --filter @seqvio/renderer pack
```

4. Smoke-test the packed CLI in a temp directory before `pnpm release`.
