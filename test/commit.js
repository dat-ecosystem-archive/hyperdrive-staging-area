var tape = require('tape')
var fs = require('fs')
var path = require('path')
var create = require('./helpers/create')

var archive
var clone

tape('create archives', function (t) {
  archive = create()
  archive.ready(function () {
    clone = create(archive.key)

    clone.staging.startAutoSync()
    var rs = archive.replicate({live: true})
    rs.pipe(clone.replicate({live: true})).pipe(rs)

    t.end()
  })
})

tape('add /hello.txt', function (t) {
  archive.staging.writeFile('/hello.txt', 'world', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(diffs, [
        {change: 'add', type: 'file', path: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('add /dir/', function (t) {
  archive.staging.mkdir('/dir', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(sortDiffs(diffs), [
        {change: 'add', type: 'dir', path: '/dir'},
        {change: 'add', type: 'file', path: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('add /dir/hello.txt', function (t) {
  archive.staging.writeFile('/dir/hello.txt', 'universe', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(sortDiffs(diffs), [
        {change: 'add', type: 'dir', path: '/dir'},
        {change: 'add', type: 'file', path: '/dir/hello.txt'},
        {change: 'add', type: 'file', path: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('commit', function (t) {
  archive.staging.commit(function (err, diffs) {
    t.error(err, 'no error')
    t.same(diffs.length, 3)
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.same(diffs.length, 0)
      t.end()
    })
  })
})

tape('replicate (archive)', function (t) {
  clone.readdir('/', function (err, files) {
    t.error(err, 'no error')
    t.deepEqual(files.sort(), ['dir', 'hello.txt'])
    clone.readFile('/hello.txt', 'utf8', function (err, v) {
      t.error(err, 'no error')
      t.same(v, 'world')
      clone.readFile('/dir/hello.txt', 'utf8', function (err, v) {
        t.error(err, 'no error')
        t.same(v, 'universe')
        t.end()
      })
    })
  })
})

tape('replicate (mirror)', function (t) {
  fs.readdir(clone.staging.path, function (err, files) {
    t.error(err, 'no error')
    t.deepEqual(files.sort(), ['dir', 'hello.txt'])
    fs.readFile(path.join(clone.staging.path, '/hello.txt'), 'utf8', function (err, v) {
      t.error(err, 'no error')
      t.same(v, 'world')
      fs.readFile(path.join(clone.staging.path, '/dir/hello.txt'), 'utf8', function (err, v) {
        t.error(err, 'no error')
        t.same(v, 'universe')
        t.end()
      })
    })
  })
})

tape('modify /hello.txt', function (t) {
  archive.staging.writeFile('/hello.txt', 'world!!', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(sortDiffs(diffs), [
        {change: 'mod', type: 'file', path: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('modify /dir/hello.txt', function (t) {
  archive.staging.writeFile('/dir/hello.txt', 'universe!!', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(sortDiffs(diffs), [
        {change: 'mod', type: 'file', path: '/dir/hello.txt'},
        {change: 'mod', type: 'file', path: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('remove /hello.txt', function (t) {
  archive.staging.unlink('/hello.txt', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(sortDiffs(diffs), [
        {change: 'mod', type: 'file', path: '/dir/hello.txt'},
        {change: 'del', type: 'file', path: '/hello.txt'}
      ])
      t.end()
    })
  })
})

tape('add /hello2.txt', function (t) {
  archive.staging.writeFile('/hello2.txt', 'computer', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(sortDiffs(diffs), [
        {change: 'mod', type: 'file', path: '/dir/hello.txt'},
        {change: 'del', type: 'file', path: '/hello.txt'},
        {change: 'add', type: 'file', path: '/hello2.txt'}
      ])
      t.end()
    })
  })
})

tape('remove /dir/hello.txt', function (t) {
  archive.staging.unlink('/dir/hello.txt', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(sortDiffs(diffs), [
        {change: 'del', type: 'file', path: '/dir/hello.txt'},
        {change: 'del', type: 'file', path: '/hello.txt'},
        {change: 'add', type: 'file', path: '/hello2.txt'}
      ])
      t.end()
    })
  })
})

tape('remove /dir/', function (t) {
  archive.staging.rmdir('/dir', function (err) {
    t.error(err, 'no error')
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.deepEqual(sortDiffs(diffs), [
        {change: 'del', type: 'dir', path: '/dir'},
        {change: 'del', type: 'file', path: '/dir/hello.txt'},
        {change: 'del', type: 'file', path: '/hello.txt'},
        {change: 'add', type: 'file', path: '/hello2.txt'}
      ])
      t.end()
    })
  })
})

tape('commit', function (t) {
  archive.staging.commit(function (err, diffs) {
    t.error(err, 'no error')
    t.same(diffs.length, 4)
    archive.staging.diff(function (err, diffs) {
      t.error(err, 'no error')
      t.same(diffs.length, 0)
      t.end()
    })
  })
})

tape('replicate (archive)', function (t) {
  clone.readdir('/', function (err, files) {
    t.error(err, 'no error')
    t.deepEqual(files.sort(), ['hello2.txt'])
    clone.readFile('/hello2.txt', 'utf8', function (err, v) {
      t.error(err, 'no error')
      t.same(v, 'computer')
      t.end()
    })
  })
})

tape('replicate (mirror)', function (t) {
  fs.readdir(clone.staging.path, function (err, files) {
    t.error(err, 'no error')
    t.deepEqual(files.sort(), ['hello2.txt'])
    fs.readFile(path.join(clone.staging.path, '/hello2.txt'), 'utf8', function (err, v) {
      t.error(err, 'no error')
      t.same(v, 'computer')
      t.end()
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
