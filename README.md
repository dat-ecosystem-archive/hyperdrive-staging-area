# staged-hyperdrive

Hyperdrive with a staging area for local, uncommited writes (wraps hyperdrive).

```js
var stagedHyperdrive = require('staged-hyperdrive')
var archive = stagedHyperdrive('./my-first-hyperdrive') // content will be stored in this folder

// normal hyperdrive usage:
archive.writeFile('/hello.txt', 'world', function (err) {
  if (err) throw err
  archive.readdir('/', function (err, list) {
    if (err) throw err
    console.log(list) // prints ['hello.txt']
    archive.readFile('/hello.txt', 'utf-8', function (err, data) {
      if (err) throw err
      console.log(data) // prints 'world'
      next()
    })
  })
})

// staged-hyperdrive usage: commit
function next() {
  archive.diff(function (err, changes) {
    if (err) throw err
    console.log(changes) // prints [{change: 'add', name: '/hello.txt'}]
    archive.commit(function (err) {
      if (err) throw err
      archive.diff(function (err, changes) {
        if (err) throw err
        console.log(changes) // prints []
        next2()
      })
    })
  })
}

// staged-hyperdrive usage: revert
function next2() {
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
}
```

The staging area is similar to in git. This module exposes an identical API to hyperdrive, but adds new API methods:

 - archive.diff() - list the changes currently in staging
 - archive.commit() - write all changes to the archive
 - archive.revert() - undo all changes

The "staging area" is defined as the current archive state written to disk. It also includes changes which have been made locally, but haven't been written the the archive's internal logs. Changes which have been downloaded remotely will overwrite whatever is in staging.

The archive operations have been modified as follows:

 - Owned archives:
   - All read operations provide the content in staging.
   - All write operations modify the content in staging.
 - Unowned archives:
   - All operations pass through to hyperdrive.

To access the current committed state, or past versions, use hyperdrive's existing `checkout()` method.

## API

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