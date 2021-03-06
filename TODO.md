# To do list

Thoughts/ideas/tasks

- [ ] Plugin should maybe support custom auth?
- [ ] Docs for readiness
- [ ] Make the code in addContentTypeParser more robust
- [ ] Add some build / publish actions
- [ ] Allow passing in a logger to plugin?
- [ ] Deploy docs for things that have been tested
- [ ] Require a flag to omit token?
- [ ] Add contributing doc docs?
- [ ] Listen for events so we don't get 404?
- [ ] jsdoc comments
- [ ] Add more docs
- [ ] Add non-http logging?
- [ ] Handle the "events" request?
- [x] Update license
- [x] Add some more tests
- [x] Use the turborepo cli in tests with a mock repo?
- [x] Rename "config" to "options"? At least be consistent.
- [x] Proper shutdown / signal stuff
- [x] Support readiness/liveness URLs?
- [x] Use npx in example
- [x] Make sure we emit types and things
- [x] Hook up entrypoint etc in package.json
- [x] Rename storageConfig in config?
- [x] Rename maxMegabytes to maxMb or similar
- [x] Check for directory existence / create dir when using fs
- [x] Check if fs folder is read/writable?
- [x] Husky
- [x] Eslint
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
- [-] Check if promises.stat always succeeds. Use that instead of also exists in
  that case
- [-] Trace IDs?
- [-] Reorg cli so it's testable?
