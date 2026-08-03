# Lifecycle And Version Policy

Seqvio separates feature/package lifecycle from capture-adapter compatibility.
The machine-readable release policy is [`../seqvio.release-policy.json`](../seqvio.release-policy.json),
and `npm run verify:contracts` enforces it after packages are built.

## Feature And Package Lifecycle

| Lifecycle | Contract |
| --- | --- |
| `public` | Documented, compiled, tested, and covered by compatibility notes. Breaking changes require a declared release change. |
| `experimental` | Reachable and tested, but its API or packaging may change before promotion. |
| `internal` | Repository implementation detail; not a supported consumer contract. |
| `deprecated` | Still available during a declared removal window, with a supported replacement. |
| `removed` | Rejected by current validation and unavailable from new public exports. |

Every workspace package must declare `seqvio.lifecycle`. The private root is
`internal`; the stable rendering/component train is `public`; capture and its
adapters remain `experimental` while host verification is incomplete.

Scene lifecycle is defined by the core scene capability registry and published
as [`scene-capabilities.json`](./scene-capabilities.json). A public scene must
have a complete compiler, a public required package, and named QA rules.

## Version Policy

The stable release train contains core, whiteboard, renderer, scatterbrain,
product-demo, and technical. Its current version line is declared only in the
machine-readable release policy. Changesets treats these packages as one fixed
group, and `npm run version` derives the release line from their generated
versions. It then synchronizes `seqvio.releaseTrain` metadata, internal exact
dependency versions, the lockfile, and the private root release marker.

The release command builds the complete workspace once in dependency order,
verifies each package's dry-run tarball without lifecycle scripts, and then
publishes through Changesets with npm lifecycle scripts disabled. This avoids
concurrent `prepack` or `prepublishOnly` builds clearing a dependency's `dist`
directory while another package is compiling. Package lifecycle builds remain
available for standalone developer packing and publishing.

Publish success is determined by postconditions rather than the Changesets exit
code alone: every public workspace's exact version must be visible on npm and
its matching tag must exist on the remote repository. This tolerates stale npm
metadata causing a duplicate-publish response, while still rejecting a zero
exit when any package version or remote tag is missing.

Capture, Browser Recorder, and Terminal Narrator use independent pre-1.0
versions. Independent versioning does not weaken dependency checks: references
to another local Seqvio package must still use its exact current version.

## Capture Adapter Compatibility

`adapterLifecycle` is separate from package lifecycle:

- `pre-stable`: CLI/artifact contracts are versioned, but supported-host gates
  have not passed everywhere.
- `stable`: the declared CLI/artifact contract and compatibility notes have
  passed on every supported host.

Terminal and Browser currently remain `experimental` packages with
`adapterLifecycle: pre-stable`. Promotion requires the Windows/Linux/macOS
runtime matrix to pass; it is not inferred from a version number.

## CI Enforcement

`npm run verify:contracts` rejects:

- missing or unknown package lifecycle metadata;
- stable release-train version drift;
- incorrect local dependency versions;
- changesets fixed-group drift;
- missing adapter compatibility markers;
- scene registry/package lifecycle conflicts; and
- drift between the core registry and `docs/scene-capabilities.json`.
