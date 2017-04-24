var tape = require('tape')
var create = require('./helpers/create')

var archive

tape('files are ignored in diff', function (t) {
  archive = create()
  archive.staging.writeFile('/.datignore', '*.bad\n/foo.txt\n/dir/foo.txt', function (err) {
    t.error(err, 'no error')
    archive.staging.writeFile('/foo.txt', 'world', function (err) {
      t.error(err, 'no error')
      archive.staging.writeFile('/foo.bad', 'world', function (err) {
        t.error(err, 'no error')
        archive.staging.mkdir('/dir', function (err) {
          t.error(err, 'no error')
          archive.staging.writeFile('/dir/foo.txt', 'world', function (err) {
            t.error(err, 'no error')
            archive.staging.diff(function (err, diffs) {
              t.error(err, 'no error')
              t.deepEqual(sortDiffs(diffs), [
                {change: 'add', type: 'file', path: '/.datignore'},
                {change: 'add', type: 'dir', path: '/dir'}
              ])
              t.end()
            })
          })
        })
      })
    })
  })
})

tape('files are ignored in commit', function (t) {
  archive = create()
  archive.staging.writeFile('/.datignore', '*.bad\n/foo.txt\n/dir/foo.txt', function (err) {
    t.error(err, 'no error')
    archive.staging.writeFile('/foo.txt', 'world', function (err) {
      t.error(err, 'no error')
      archive.staging.writeFile('/foo.bad', 'world', function (err) {
        t.error(err, 'no error')
        archive.staging.mkdir('/dir', function (err) {
          t.error(err, 'no error')
          archive.staging.writeFile('/dir/foo.txt', 'world', function (err) {
            t.error(err, 'no error')
            archive.staging.commit(function (err, diffs) {
              t.error(err, 'no error')
              t.deepEqual(sortDiffs(diffs), [
                {change: 'add', type: 'file', path: '/.datignore'},
                {change: 'add', type: 'dir', path: '/dir'}
              ])
              t.end()
            })
          })
        })
      })
    })
  })
})

tape('files are ignored in revert', function (t) {
  archive = create()
  archive.staging.writeFile('/.datignore', '*.bad\n/foo.txt', function (err) {
    t.error(err, 'no error')
    archive.staging.writeFile('/foo.txt', 'world', function (err) {
      t.error(err, 'no error')
      archive.staging.writeFile('/foo.bad', 'world', function (err) {
        t.error(err, 'no error')
        archive.staging.mkdir('/dir', function (err) {
          t.error(err, 'no error')
          archive.staging.writeFile('/dir/foo.txt', 'world', function (err) {
            t.error(err, 'no error')
            archive.staging.revert(function (err, diffs) {
              t.error(err, 'no error')
              t.deepEqual(sortDiffs(diffs), [
                {change: 'add', type: 'file', path: '/.datignore'},
                {change: 'add', type: 'dir', path: '/dir'},
                {change: 'add', type: 'file', path: '/dir/foo.txt'}
              ])
              t.end()
            })
          })
        })
      })
    })
  })
})

tape('reverts dont delete non-empty folders', function (t) {
  archive = create()
  archive.staging.writeFile('/.datignore', '/dir/foo.txt', function (err) {
    t.error(err, 'no error')
    archive.staging.mkdir('/dir', function (err) {
      t.error(err, 'no error')
      archive.staging.writeFile('/dir/foo.txt', 'world', function (err) {
        t.error(err, 'no error')

        // a revert here would, due to ignore rules, delete /dir but not /dir/foo.txt
        // that should error out

        archive.staging.revert(function (err, diffs) {
          t.ok(err)
          t.is(err.code, 'ENOTEMPTY')
          t.end()
        })
      })
    })
  })
})

function sortDiffs (diffs) {
  diffs = diffs.slice() // clone array
  diffs.sort(function (a, b) {
    return a.path.localeCompare(b.path)
  })
  return diffs
}
