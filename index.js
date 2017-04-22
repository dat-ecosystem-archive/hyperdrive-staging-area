var dft = require('diff-file-tree')
var ScopedFS = require('scoped-fs')

module.exports = setup

function setup (archive, stagingPath) {
  // setup staging object
  var staging = new ScopedFS(stagingPath)
  staging.path = stagingPath
  staging.diff = cb => diffStaging(archive, stagingPath, cb)
  staging.commit = cb => commit(archive, stagingPath, cb)
  staging.revert = cb => revert(archive, stagingPath, cb)
  staging.startAutoSync = () => archive.metadata.on('append', onAppend)
  staging.stopAutoSync = () => archive.metadata.removeEventListener('append', onAppend)

  function onAppend () {
    staging.revert()
  }

  return staging
}

function diffStaging (archive, stagingPath, cb) {
  var p = dft.diff(stagingPath, {fs: archive})
  if (cb) p.then(c => cb(null, c), cb)
}

function commit (archive, stagingPath, cb) {
  diffStaging(archive, stagingPath, (err, c) => {
    if (err) return cb && cb(err)
    var p = dft.applyRight(stagingPath, {fs: archive}, c)
    if (cb) p.then(() => cb(null, c), cb)
  })
}

function revert (archive, stagingPath, cb) {
  diffStaging(archive, stagingPath, (err, c) => {
    if (err) return cb && cb(err)
    var p = dft.applyLeft(stagingPath, {fs: archive}, c)
    if (cb) p.then(() => cb(null, c), cb)
  })
}
