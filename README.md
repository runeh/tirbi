# tirbi

## To do

- [ ] Hook up env stuff in commander
- [ ] Allow omitting token to allow everything
- [ ] Add docs
- [ ] Rename fileStorage to cacheStorage?
- [ ] Don't use URIs for storage that isn't URIs?
- [ ] Add some tests
- [ ] Make the other methods on storage allowed to return promises
- [ ] Throw handling is weird
- [ ] Use custom errors when throwing?
- [ ] Allow multiple tokens?
- [ ] Add non-http logging?
- [ ] Trace IDs?
- [ ] Handle the "events" request?
- [ ] Maybe get rid of envalid again? Or pass cli stuff into it?
- [ ] Check for permissions when using gcp
- [ ] Check for directory existence / create dir when using fs
- [ ] Check if promises.stat always succeeds. Use that instead of also exists in
      that case
- [ ] Check if fs folder is read/writable?
- [ ] Pretty output cli option
- [x] Add some CLI stuff?
- [x] In-memory storage adapter
