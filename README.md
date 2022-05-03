# tirbi

## Getting started

Build:

```shell
yarn
yarn build
```

Run:

```shell
yarn start
```

The app expects the following environment variables to be set:

- `PORT` - The port to bind the server to.
- `TOKEN` - The security token used by clients to authenticate.
- `STORAGE_URL` - Where to read and write cached files. Currently supported is
  the local file system and Google Cloud Storage. Allowed formats:
  - `file:/tmp/tirbi` - Stores data on the local file system in the `/tmp/tirbi`
    folder.
  - `gs://tirbi-cache/builds` - Stores data in the `tirbi-cache/buildes` bucket
    in GCS.

A turborepo client can then be run like this:

```shell
turbo run build --team=nope --token=secret --api=http://localhost:3232
```

The `team` option is required by turborepo, but ignored by tirbi for now. The
token must be the same the one set in the `TOKEN` environment variable. The Aapi
option must point to where tirbi is running.

## Docker

There is an included Dockerfile. Run `yarn build-docker` to run the docker
build.

## To do

- [ ] Option to omit events log?
- [ ] Allow passing in log stuff
- [ ] Use traceid thing from turbo?
- [ ] Init process thingy?
- [ ] Check for permissions when using gcp
- [ ] Check for directory existence / create dir when using fs
- [ ] Add some CLI stuff?
- [ ] Check if promises.stat always succeeds. Use that instead of also exists in
      that case
- [ ] Check if fs folder is read/writable?
