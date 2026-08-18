# linear-zapier

Linear's Zapier application.

## Installation

This app uses Yarn 1 as its package manager. Use `yarn install` to install dependencies, or `yarn` as the shorthand. Do not run `npm install` or commit a `package-lock.json`; `yarn.lock` is the dependency lockfile for this repo.

```
yarn global add zapier-platform-cli
yarn install
```

Use the version in `.nvmrc`, which is what the Zapier CLI needs. Zapier runs the integration itself on the Node version tied to the `zapier-platform-core` major, which is Node 18 today and is what `engines.node` describes; moving the integration to Node 22 means upgrading `zapier-platform-core`. If you're running a newer version and don't have `nvm` set up, you can run `yarn install --ignore-engines` to disable the Node version check.

## Developing

- `yarn zapier-validate` - Validates Zapier app content
- `yarn test` - Tests your app

For testing, save your envvars to `.env`. `.env.default` has the required variables listed for development/testing.

### Deployment

A release starts in your own pull request. Bump the minor version in `package.json` and add a
matching `## <version>` entry to `CHANGELOG.md` alongside the code. CI fails the pull request if
code that reaches Zapier changes without both.

Merging to master uploads that version to Zapier and promotes it, so new Zaps get it.

The workflow asks Zapier which versions it holds instead of assuming, so a release that never
arrived is retried on the next push to master. Run it from the Actions tab when you want it sooner.

Two things the release does not do. It does not move existing Zaps to the new version, so they
keep running the version they were built on. It does not deprecate old versions.

One case the check cannot see: a `yarn upgrade` that only re-resolves a transitive production
dependency changes what Zapier runs without touching `src/` or the `dependencies` block. Bump the
version by hand when you do that.

## Forking

If you want to make changes and run your own version of this app, remove `.zapierapprc` file and create a new Zapier app with `zapier register "My app"` under your own Zapier account.

## License

MIT
