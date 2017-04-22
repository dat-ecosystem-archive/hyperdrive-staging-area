var promisify = require('es6-promisify')
var fs = require('fs')
var streamEqual = require('stream-equal')
var Hyperdrive = require('hyperdrive')
var anymatch = require('anymatch')
var {join} = require('./util')

var sReaddir = promisify(fs.readdir, fs)
var sStat = promisify(fs.stat, fs)

const SKIP = ['/.dat']

module.exports = function diffStaging (cb) {
  var archive = this
  var base = archive.stagingPath
  var changes = []
  var aReaddir = promisify(Hyperdrive.prototype.readdir, archive)
  var aStat = promisify(Hyperdrive.prototype.lstat, archive)
  walk('/').then(v => cb(null, changes), cb)

  async function walk (path) {
    console.log('walk', path)
    // get files in folder
    var [sNames, aNames] = await Promise.all([
      sReaddir(join(base, path)),
      aReaddir(path)
    ])

    // run ops based on set membership
    var ps = []
    console.log(sNames, aNames)
    sNames.forEach(name => {
      if (aNames.indexOf(name) === -1) {
        ps.push(addRecursive(join(path, name)))
      } else {
        ps.push(diff(join(path, name)))
      }
    })
    aNames.forEach(name => {
      if (sNames.indexOf(name) === -1) {
        ps.push(delRecursive(join(path, name)))
      } else {
        // already handled
      }
    })
    return Promise.all(ps)
  }

  async function diff (path) {
    console.log('diff', path)
    if (anymatch(SKIP, path)) {
      return
    }
    // stat the file
    var [sSt, aSt] = await Promise.all([
      sStat(join(base, path)),
      aStat(path)
    ])
    // both a file
    if (sSt.isFile() && aSt.isFile()) {
      return diffFile(path, sSt, aSt)
    }
    // both a dir
    if (sSt.isDirectory() && aSt.isDirectory()) {
      return walk(path)
    }
    // incongruous, remove all in archive then add all in staging
    await delRecursive(path)
    await addRecursive(path)
  }

  async function diffFile (path) {
    console.log('diffFile', path)
    var isEq = await new Promise((resolve, reject) => {
      streamEqual(
        fs.createReadStream(join(base, path)),
        Hyperdrive.prototype.createReadStream.call(archive, path),
        (err, res) => {
          if (err) reject(err)
          else resolve(res)
        }
      )
    })
    if (!isEq) {
      changes.push({change: 'modify', type: 'file', name: path})
    }
  }

  async function addRecursive (path) {
    console.log('addRecursive', path)
    if (anymatch(SKIP, path)) {
      return
    }
    // find everything at and below the current path in staging
    // they should be added
    var st = await sStat(join(base, path))
    if (st.isFile()) {
      changes.push({change: 'add', type: 'file', name: path})
    } else if (st.isDirectory()) {
      // add dir first
      changes.push({change: 'add', type: 'directory', name: path})
      // add children second
      var children = await sReaddir(join(base, path))
      await Promise.all(children.map(name => addRecursive(join(path, name))))
    }
  }

  async function delRecursive (path) {
    console.log('delRecursive', path)
    if (anymatch(SKIP, path)) {
      return
    }
    // find everything at and below the current path in the archive
    // they should be removed
    var st = await aStat(path)
    if (st.isFile()) {
      changes.push({change: 'del', type: 'file', name: path})
    } else if (st.isDirectory()) {
      // del children second
      var children = await aReaddir(path)
      await Promise.all(children.map(name => delRecursive(join(path, name))))
      // del dir second
      changes.push({change: 'del', type: 'directory', name: path})
    }
  }
}
