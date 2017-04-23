# hyperdrive-staging-area

Staging area for local, uncommited writes that can sync to a hyperdrive

```
npm install hyperdrive-staging-area
```

## TODO

 - [x] Copy received files into the staging area
 - [x] Add .diff()
 - [x] Add .commit()
 - [x] Add .revert()
 - [ ] Add support for .datignore
 - [x] Tests

## Usage

hyperdrive-staging-area provides an fs-compatible object, plus a few additional methods

```js
var HSA = require('hyperdrive-staging-area')
var archive = hyperdrive('./my-first-hyperdrive-meta') // metadata will be stored in this folder
var staging = HSA(archive, './my-first-hyperdrive', true) // content will be stored in this folder

staging.writeFile('/hello.txt', 'world', function (err) {
  if (err) throw err
  staging.readdir('/', function (err, list) {
    if (err) throw err
    console.log(list) // prints ['hello.txt']
    staging.readFile('/hello.txt', 'utf-8', function (err, data) {
      if (err) throw err
      console.log(data) // prints 'world'
    })
  })
})
```

At this point, the archive is still unchanged.

```js
archive.readFile('/hello.txt', 'utf-8', function (err) {
  console.log(err) // => NotFound
})
```

To be applied to the archive, the changes must be committed:

```js
staging.diff(function (err, changes) {
  if (err) throw err
  console.log(changes) // prints [{change: 'add', type: 'file', path: '/hello.txt'}]
  staging.commit(function (err) {
    if (err) throw err
    staging.diff(function (err, changes) {
      if (err) throw err
      console.log(changes) // prints []
      archive.readFile('/hello.txt', 'utf-8', function (err, data) {
        if (err) throw err
        console.log(data) // prints 'world'
      })
    })
  })
})
```

Changes can also be reverted after writing them to staging.

```js
staging.writeFile('/hello.txt', 'universe!', function (err) {
  if (err) throw err
  staging.diff(function (err, changes) {
    if (err) throw err
    console.log(changes) // prints [{change: 'mod', type: 'file', path: '/hello.txt'}]
    staging.revert(function (err) {
      if (err) throw err
      staging.readFile('/hello.txt', 'utf-8', function (err, data) {
        if (err) throw err
        console.log(data) // prints 'world'
      })
    })
  })
})
```

## API

#### `var staging = HyperdriveStagingArea(archive, stagingPath)`

Create a staging area for `archive` at the given `stagingPath`.

#### `staging.diff(cb)`

List the changes currently in staging. Output looks like:

```js
[
  {
    change: 'add' | 'mod' | 'del'
    type: 'dir' | 'file'
    path: String (path of the file)
  },
  ...
]
```

#### `staging.commit(callback)`

Write all changes to the archive.

#### `staging.revert()`

Undo all changes so that staging is reverted to the archive stage.

#### `staging.startAutoSync()`

Listens for updates to the archive and automatically reverts the staging area when a new entry is appended. Useful for syncing the staging for downloaded archives.

#### `staging.stopAutoSync()`

Stop syncing the staging area.