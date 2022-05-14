# tirbi

Tirbi is a remote cache implementation that is compatible with the
[remote caching](https://turborepo.org/docs/core-concepts/remote-caching)
feature of [turborepo](https://turborepo.org). It supports storing cached assets
on the file system, in memory, or in Google Cloud Storage bucket. Feel free to
contribute other storage backends.

Tirbi can be used either as a stand-alone command line server, or as a fastify
plugin.

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
  await server.register(tirbiPlugin, {
    storage: { kind: 'memory' },
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

yarn lint-staged
