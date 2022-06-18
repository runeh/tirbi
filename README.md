# tirbi

Tirbi is a remote cache implementation that is compatible with the
[remote caching](https://turborepo.org/docs/core-concepts/remote-caching)
feature of [turborepo](https://turborepo.org). It supports storing cached assets
on the file system, in memory, or in Google Cloud Storage bucket. Feel free to
contribute other storage backends.

Tirbi can be used either as a command line server, or as a fastify plugin.

## Quick start

Run tirbi server:

```shell
npx tirbi
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

## fastify plugin

Tirbi exports a `tirbiPlugin` object that is a fastify plugin:

```typescript
import fastify from 'fastify';
import { tirbiPlugin } from 'tirbi';

async function main() {
  const server = fastify({ logger: true });
  await server.register(tirbiPlugin, {
    storage: { kind: 'memory' },
    tokens: ['s3cr3t'],
  });
  await server.listen(3030, '0.0.0.0');
}

main();
```

Have a look in [`cli.ts`](./src/cli.ts) to see how the tirbi CLI starts a
server.

## Reference

Interface describing the options of the fastify plugin.

### `TirbiOptions`

- `tokens` - (optional) an array of allowed authorization tokens as strings. If
  omitted, authorization tokens will not be checked.
- `storage` - an object configuring the storage backend. See `StorageOptions`

### `StorageOptions`

There are TypeScript types for the supported storage backends:

- `FileSystemStorageOptions` - Options for file system storage backend.
- `MemoryStorageOptions` - Options for in-memory storage backend.
- `GcsStorageOptions` - Options for Google Cloud Storage backend.
- `StorageOptions` - The union of the backend option types.

### `parseStorageUri`

Parse a URI string to a `StorageOptions` object. Returns null if there if the
URI is invalid, or uses an unknown scheme. This function will never throw an
error.

### `tirbiPlugin`

A fastify plugin. Takes a `TirbiOptions` argument.

## Docker usage

The following dockerfile lets you run tirbi in docker:

```dockerfile
FROM node:16-alpine3.14
RUN npm install -g tirbi
CMD ["tirbi"]
```

Use environment variables the control the settings of the server.

## Compatibility

Tirbi has been tested with turborepo versions between 1.2.1 and 1.2.15.

## Caveats

- Turborepo requires a `team` to be set when using remote caches. tirbi ignores
  the team setting, so it can be set to anything
- There's a bug that only lets you pass in a single auth token to tirbi when
  using environment variables.
- Turborepo sends requests to an `events` URL, with information about what it's
  been doing. Tirbi ignores this call, so it will turn up in the logs as a 404
  request.

## Misc

### Liveness probe

The cli listens for requests to `/healthz`, end replies with a 204. This is
useful if running in docker or other managed platforms that probes a service for
its liveness status.

### Pretty logs

To get nicely formatted logs on the command line, use
[`pino-pretty`](https://github.com/pinojs/pino-pretty):

```shell
tirbi | pino-pretty
```

yarn lint-staged

## Publishing

Uses
[`standard-version`](https://github.com/conventional-changelog/standard-version).

Can be invoked with `yarn release`.

- `yarn release --release-as major`
- `yarn release --release-as minor`
- `yarn release --release-as patch`
- `yarn release --prerelease`

After this runs, push in and run `npm publish`.
