# tirbi

## Getting started

Run tirbi server:

```shell
yarn tirbi
```

This starts an in-memory server that allows any authentication token. This is
meant for testing, and not recommended for production use.

Run a build with turborepo that uses tirbi as cache:

```shell
yarn turbo run build \
     --team=not_used --token="anything" --remote-only \
     --api=http://localhost:8080
```

The turbo build should be loading and saving cached artifacts to the tirbi
server.

## Misc

### Pretty logs

Use [`pino-pretty`](https://github.com/pinojs/pino-pretty):

```shell
tirbi | pino-pretty
```

## To do

- [ ] Add docs
- [ ] Don't use URIs for storage that isn't URIs?
- [ ] Add some tests
- [ ] Throw handling is weird
- [ ] Use custom errors when throwing?
- [ ] Add non-http logging?
- [ ] Trace IDs?
- [ ] Handle the "events" request?
- [ ] Check for directory existence / create dir when using fs
- [ ] Check if promises.stat always succeeds. Use that instead of also exists in
      that case
- [ ] Check if fs folder is read/writable?
- [ ] Pretty output cli option
- [x] Add some CLI stuff?
- [x] In-memory storage adapter
- [x] Allow omitting token to allow everything
- [x] Allow multiple tokens?
- [x] Check for permissions when using gcp
- [x] Hook up env stuff in commander
- [x] Maybe get rid of envalid again? Or pass cli stuff into it?
- [x] Rename fileStorage to cacheStorage?
- [x] Make the other methods on storage allowed to return promises
