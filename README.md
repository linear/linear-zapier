# linear-zapier

Linear's Zapier application.

## Installation

```
yarn global add zapier-platform-cli
yarn
```

Zapier runs on AWS Lambda and requires Node 8. If you're running never version and don't have `nvm` set up, you can always run `yarn` with `--ignore-engines` which disables Node version check.

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
