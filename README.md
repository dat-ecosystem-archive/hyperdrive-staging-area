# hyperdrive-staging-area

Staging area for local, uncommited writes that can sync to a hyperdrive. Respects `.datignore`.

```
npm install hyperdrive-staging-area
```

## Usage

hyperdrive-staging-area provides an fs-compatible object, plus a few additional methods

```js
var hyperdrive = require('hyperdrive')
var hyperstaging = require('hyperdrive-staging-area')
var archive = hyperdrive('./my-first-hyperdrive-meta') // metadata will be stored in this folder
var staging = hyperstaging(archive, './my-first-hyperdrive') // content will be stored in this folder

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

#### `var staging = HyperdriveStagingArea(archive, stagingPath[, baseOpts])`

Create a staging area for `archive` at the given `stagingPath`.

You can specify `baseOpts` to be passed as the defaults to diff, commit, and revert. Options include:

```
{
  skipDatIgnore: false // dont use the .datignore rules
  ignore: ['.dat', '.git'] // base ignore rules (used in addition to .datignore)
  filter: false // a predicate of (path) => bool, where writes are skipped if == true. Takes precedence over .datignore
}
```

#### `staging.path`

Path to staging folder.

#### `staging.isStaging`

True

#### `staging.key`

Archive key.

#### `staging.writable`

Is the archive writable?

#### `staging.diff(opts, cb)`

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

Options include:

```
{
  skipDatIgnore: false // dont use the .datignore rules
  ignore: ['.dat', '.git'] // base ignore rules (used in addition to .datignore)
  filter: false // a predicate of (path) => bool, where writes are skipped if == true. Takes precedence over .datignore
}
```

#### `staging.commit(opts, cb)`

Write all changes to the archive.

Options include:

```
{
  skipDatIgnore: false // dont use the .datignore rules
  ignore: ['.dat', '.git'] // base ignore rules (used in addition to .datignore)
  filter: false // a predicate of (path) => bool, where writes are skipped if == true. Takes precedence over .datignore
}
```

#### `staging.revert(opts, cb)`

Undo all changes so that staging is reverted to the archive stage.

Options include:

```
{
  skipDatIgnore: false // dont use the .datignore rules
  ignore: ['.dat', '.git'] // base ignore rules (used in addition to .datignore)
  filter: false // a predicate of (path) => bool, where writes are skipped if == true. Takes precedence over .datignore
}
```

#### `staging.readIgnore(opts, cb)`

Read the .datignore and provide a `filter(path)=>bool` function. The callback does not provide an error, so its signature is `cb(filterFn)`.

Options include:

```
{
  skipDatIgnore: false // dont use the .datignore rules
  ignore: ['.dat', '.git'] // base ignore rules (used in addition to .datignore)
}
```

#### `staging.startAutoSync()`

Listens for updates to the archive and automatically reverts the staging area when a new entry is appended. Useful for syncing the staging for downloaded archives.

#### `staging.stopAutoSync()`

Stop syncing the staging area.

#### `HyperdriveStagingArea.parseIgnoreRules(str)`

Parses the list of rules in a `.datignore` and outputs an array that can be used by anymatch.