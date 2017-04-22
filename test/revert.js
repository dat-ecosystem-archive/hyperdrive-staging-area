var tape = require('tape')
var create = require('./helpers/create')

var archive

tape('create archive', function (t) {
  archive = create()
  t.end()
})

tape('add /hello.txt', function (t) {
  archive.writeFile('/hello.txt', 'world', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(diffs, [
        {change: 'add', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('add /dir/', function (t) {
  archive.mkdir('/dir', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'add', type: 'directory', name: '/dir'},
        {change: 'add', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('add /dir/hello.txt', function (t) {
  archive.writeFile('/dir/hello.txt', 'universe', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'add', type: 'directory', name: '/dir'},
        {change: 'add', type: 'file', name: '/dir/hello.txt'},
        {change: 'add', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('revert', function (t) {
  archive.revert(function (err, diffs) {
    t.error(err, 'no error')
    t.same(diffs.length, 3)
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      t.same(diffs.length, 0)
      archive.readdir('/', function (err, files) {
        t.error(err, 'no error')
        t.same(files.length, 0)
        t.end()
      })
    })
  })
})

tape('add /hello.txt', function (t) {
  archive.writeFile('/hello.txt', 'world', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(diffs, [
        {change: 'add', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('add /dir/', function (t) {
  archive.mkdir('/dir', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'add', type: 'directory', name: '/dir'},
        {change: 'add', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('add /dir/hello.txt', function (t) {
  archive.writeFile('/dir/hello.txt', 'universe', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'add', type: 'directory', name: '/dir'},
        {change: 'add', type: 'file', name: '/dir/hello.txt'},
        {change: 'add', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('commit', function (t) {
  archive.commit(function (err, diffs) {
    t.error(err, 'no error')
    t.same(diffs.length, 3)
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      t.same(diffs.length, 0)
      t.end()
    })
  })
})

tape('modify /hello.txt', function (t) {
  archive.writeFile('/hello.txt', 'world!!', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'modify', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('modify /dir/hello.txt', function (t) {
  archive.writeFile('/dir/hello.txt', 'universe!!', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'modify', type: 'file', name: '/dir/hello.txt'},
        {change: 'modify', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('remove /hello.txt', function (t) {
  archive.unlink('/hello.txt', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'modify', type: 'file', name: '/dir/hello.txt'},
        {change: 'del', type: 'file', name: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('add /hello2.txt', function (t) {
  archive.writeFile('/hello2.txt', 'computer', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'modify', type: 'file', name: '/dir/hello.txt'},
        {change: 'del', type: 'file', name: '/hello.txt'},
        {change: 'add', type: 'file', name: '/hello2.txt'}
      ])
      t.end()
    })
  })
})

tape('remove /dir/hello.txt', function (t) {
  archive.unlink('/dir/hello.txt', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'del', type: 'file', name: '/dir/hello.txt'},
        {change: 'del', type: 'file', name: '/hello.txt'},
        {change: 'add', type: 'file', name: '/hello2.txt'}
      ])
      t.end()
    })
  })
})

tape('remove /dir/', function (t) {
  archive.rmdir('/dir/', function (err) {
    t.error(err, 'no error')
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      sortDiffs(diffs)
      t.deepEqual(diffs, [
        {change: 'del', type: 'directory', name: '/dir'},
        {change: 'del', type: 'file', name: '/dir/hello.txt'},
        {change: 'del', type: 'file', name: '/hello.txt'},
        {change: 'add', type: 'file', name: '/hello2.txt'}
      ])
      t.end()
    })
  })
})

tape('revert', function (t) {
  archive.revert(function (err, diffs) {
    t.error(err, 'no error')
    t.same(diffs.length, 4)
    archive.diffStaging(function (err, diffs) {
      t.error(err, 'no error')
      t.same(diffs.length, 0)
      archive.readdir('/', function (err, files) {
        t.error(err, 'no error')
        t.deepEqual(files.sort(), ['dir', 'hello.txt'])
        archive.readdir('/dir', function (err, files) {
          t.error(err, 'no error')
          t.deepEqual(files.sort(), ['hello.txt'])
          archive.readFile('/hello.txt', 'utf8', function (err, v) {
            t.error(err, 'no error')
            t.same(v, 'world')
            archive.readFile('/dir/hello.txt', 'utf8', function (err, v) {
              t.error(err, 'no error')
              t.same(v, 'universe')
              t.end()
            })
          })
        })
      })
    })
  })
})

function sortDiffs (diffs) {
  diffs.sort(function (a, b) {
    return a.name.localeCompare(b.name)
  })
}
