# staged-hyperdrive

Hyperdrive with a staging area for local, uncommited writes.

```
npm install staged-hyperdrive
```

## TODO

 - [ ] Copy received files into the staging area
 - [ ] Add .diff()
 - [ ] Add .commit()
 - [ ] Add .revert()
 - [ ] Tests

## Usage

Staged-hyperdrive adds new methods (and behaviors) to hyperdrive.

```js
var stagedHyperdrive = require('staged-hyperdrive')
var archive = stagedHyperdrive('./my-first-hyperdrive') // content will be stored in this folder

archive.writeFile('/hello.txt', 'world', function (err) {
  if (err) throw err
  archive.readdir('/', function (err, list) {
    if (err) throw err
    console.log(list) // prints ['hello.txt']
    archive.readFile('/hello.txt', 'utf-8', function (err, data) {
      if (err) throw err
      console.log(data) // prints 'world'
    })
  })
})
```

At this point, the archive is still unchanged. The changes must be committed:

```js
archive.diff(function (err, changes) {
  if (err) throw err
  console.log(changes) // prints [{change: 'add', name: '/hello.txt'}]
  archive.commit(function (err) {
    if (err) throw err
    archive.diff(function (err, changes) {
      if (err) throw err
      console.log(changes) // prints []
    })
  })
})
```

Changes can also be reverted after write:

```js
archive.writeFile('/hello.txt', 'universe!', function (err) {
  if (err) throw err
  archive.diff(function (err, changes) {
    if (err) throw err
    console.log(changes) // prints [{change: 'modify', name: '/hello.txt'}]
    archive.revert('/hello.txt', function (err) {
      if (err) throw err
      archive.readFile('/hello.txt', 'utf-8', function (err, data) {
        if (err) throw err
        console.log(data) // prints 'world'
      })
    })
  })
})
```

## Details

The "staging area" is the current archive state written to disk. It includes changes which have been made locally, but which may not have been written the the archive's internal logs. The archive operations have been modified as follows:

 - Owned archives:
   - All read operations provide the content in staging.
   - All write operations modify the content in staging.
   - The .dat folder is hidden from reads and make inaccessible.
 - Unowned archives:
   - All operations pass through to hyperdrive.
   - Changes are downloaded will overwrite whatever is in staging.

To access the current committed state, or past versions, use hyperdrive's existing `checkout()` method.

## API

**NOTE** StagedArchive's constructor must be given a string for `storage`. Metadata is stored under `./.dat`.

#### `archive.diff(callback)`

List the changes currently in staging. Output looks like:

```js
[
  {
    change: 'add' | 'modify' | 'del',
    name: String (path of the file)
  },
  ...
]
```

#### `archive.commit(callback)`

Write all changes to the archive. Output is the same as `diff()`.

#### `archive.revert()`

Undo all changes.  Output is the same as `diff()`, but indicates that those changes were *not* applied.