# Release procedure

Publication is a separate operation from source preparation. The manual workflow
does not run on pushes or tags. It requires an exact version and commit, rechecks
the package, and publishes from GitHub Actions with provenance. No credential or
npm publisher relationship is created by this repository.

## First publication

Version 0.1.0 was published on October 6, 2026 through [GitHub Actions run 37446661910](https://github.com/equinoxaifinance-rgb/n8n-nodes-civicdataforge/actions/runs/37446661910). Registry readback confirmed maintainer `civicdataforge` and author CivicDataForge. The bootstrap procedure below is historical context; do not repeat first-publication token setup for an existing release. Use the approved trusted publisher for subsequent versions.

npm requires a package to exist before configuring a trusted publisher. For an
initial GitHub Actions publication, an owner can separately authorize a narrowly
scoped, short-lived granular npm credential, store it securely as this repository's
`NPM_TOKEN` Actions secret, and select `bootstrap`. Do not put a credential in a
workflow, issue, log, README, or chat. Review the credential's first-package creation
permission in npm rather than assuming an existing-package grant covers it. After
successful publication, revoke the bootstrap credential and remove the secret.

An alternative is npm staged publishing (npm 11.15+ and account 2FA). Staging a
new name publishes a public `0.0.0-stage` placeholder; it is not a private/read-only
operation. It still requires authenticated setup and subsequent 2FA approval.
Any eventual release submitted to n8n must have GitHub Actions provenance. Do not
substitute an ordinary local publish for that requirement.

## Subsequent trusted publishing

The owner must explicitly authorize npm's publisher relationship for:

- GitHub owner: `equinoxaifinance-rgb`
- Repository: `n8n-nodes-civicdataforge`
- Workflow filename: `publish.yml`
- GitHub-hosted runner; explicit publish permission for this exact package (a stage-only grant does not authorize publish)

This is a persistent permission and is not implicitly established by adding the
workflow file. npm account 2FA and an authenticated authorized maintainer are
required for setup. Use `oidc` after the exact relationship exists. OIDC requires
npm 11.5.1+ and Node 22.14+; the workflow selects Node 24.

## Readback and n8n review

After one dispatch, inspect its run and npm version before any retry. An uncertain
publish can have succeeded. Verify the registry tarball, repository commit,
integrity and provenance. Then submit the npm package through Creator Portal;
record its automated checks and review result. n8n review is an external decision,
not implied by a successful publish or local test.

Sources checked October 6, 2026:

- https://docs.npmjs.com/cli/v11/commands/npm-trust/
- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/staged-publishing/
- https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes
