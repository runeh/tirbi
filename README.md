# tirbi

Tirbi is a remote cache implementation that is compatible with
[turborepo](https://turborepo.org). It supports storing cached assets on the
file system, in memory, or in Google Cloud Storage bucket.

Tirbi can be used either as a stand-alone command line application, or as a
fastify plugin.

## Getting started

Install tirbi:

```shell
npm install -g tirbi
```

Run tirbi server:

```shell
tirbi
```

This starts server that allows any authentication token and stores cached data
in memory.

Run a build with turborepo that uses tirbi as cache:

```shell
yarn turbo run build \
     --team=not_used --token="anything" --remote-only \
     --api=http://localhost:8080
```

The turbo build should be loading and saving cached artifacts to the tirbi
server.

Run `tirbi --help` to see the list of command line options.

The server can also be configured using environment variables:

- `HOST` - Host to bind to
- `PORT` - Port to bind to
- `STORAGE` - Storage URI
- `TOKEN` - An auth token

## Programmatic usage

The module exports a `tirbiPlugin` object that is a fastify plugin. It can be
used like this:

```typescript
import fastify from 'fastify';
import { tirbiPlugin } from 'tirbi';

async function main() {
  const server = fastify({ logger: true });
  server.register(tirbiPlugin, {
    storageConfig: { kind: 'memory' },
    tokens: ['s3cr3t'],
  });
  await server.listen(3030, '0.0.0.0');
}

main();
```

The module also exports the following:

- `StorageConfig` - Interface describing the available storage configs.
- `parseStorageUri` - Utility function to parse a storage URI into a
  `StorageConfig` object
- `TirbiConfig` - Interface describing the config options of the fastify plugin.

Have a look in [`cli.ts`](./src/cli.ts) to see how the tirbi CLI starts a
server.

## Docker usage

The following dockerfile lets you run tirbi in docker:

```dockerfile

FROM node:16-alpine3.14

RUN npm install -g tirbi

CMD ["tirbi"]
```

Use environment variables the control the settings of the server.

## Compatibility

Tirbi has been tested with turborepo versions between 1.23 and 1.28.

## Caveats

- Turborepo requires a `team` to be set when using remote caches. tirbi ignores
  the team setting, so it can be set to anything
- There's a bug that only lets you pass in a single auth token to tirbi when
  using environment variables.
- Turborepo sends requests to an `events` URL, with information about what it's
  been doing. Tirbi ignores this call, so it will turn up in the logs as a 404
  request.

## Misc

### Pretty logs

To get nicely formatted logs on the command line, use
[`pino-pretty`](https://github.com/pinojs/pino-pretty):

```shell
tirbi | pino-pretty
```

## To do

- [ ] Rename storageConfig in config?
- [ ] Husky
- [ ] Eslint
- [ ] Rename maxMegabytes to maxMb or similar
- [ ] Listen for events so we don't get 404?
- [ ] jsdoc comments
- [ ] Proper shutdown / signal stuff
- [ ] Add docs
- [ ] Add some tests
- [ ] Add non-http logging?
- [ ] Trace IDs?
- [ ] Handle the "events" request?
- [ ] Check for directory existence / create dir when using fs
- [ ] Check if promises.stat always succeeds. Use that instead of also exists in
      that case
- [ ] Check if fs folder is read/writable?
- [x] Pull the cache server parts into a plugin that can be imported separately
- [x] Add some CLI stuff?
- [x] In-memory storage adapter
- [x] Allow omitting token to allow everything
- [x] Allow multiple tokens?
- [x] Check for permissions when using gcp
- [x] Hook up env stuff in commander
- [x] Maybe get rid of envalid again? Or pass cli stuff into it?
- [x] Rename fileStorage to cacheStorage?
- [x] Make the other methods on storage allowed to return promises
- [x] Rename "storageDef" to "storageConfig" or something?
- [-] Throw handling is weird
- [-] Don't use URIs for storage that isn't URIs?
- [-] Pretty output cli option
- [-] Use custom errors when throwing?
