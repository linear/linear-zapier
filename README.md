# linear-zapier

Linear's Zapier application.

## Installation

This app uses Yarn 1 as its package manager. Use `yarn install` to install dependencies, or `yarn` as the shorthand. Do not run `npm install` or commit a `package-lock.json`; `yarn.lock` is the dependency lockfile for this repo.

```
yarn global add zapier-platform-cli
yarn install
```

Use Node 18 or newer, matching `package.json`. If you're running a newer version and don't have `nvm` set up, you can run `yarn install --ignore-engines` to disable the Node version check.

## Developing

- `yarn zapier-validate` - Validates Zapier app content
- `yarn test` - Tests your app

For testing, save your envvars to `.env`. `.env.default` has the required variables listed for development/testing.

### Deployment

Prerequisites:

- Make sure you have updated the version number in `package.json`.
- If updating Linear's app, you'll need to have access to Linear's Zapier account and generate a deploy key in `Settings > Deploy Keys`. You can then authenticate with the key using `zapier login --sso`.

You can deploy the app to Zapier with `yarn zapier-push`. This will also run `yarn zapier-validate` before deploying.

After deploying, you'll need to manually promote the version to 'public' in Zapier's dashboard under `App > Manage > Versions`.

## Forking

If you want to make changes and run your own version of this app, remove `.zapierapprc` file and create a new Zapier app with `zapier register "My app"` under your own Zapier account.

## License

MIT
