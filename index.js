var dft = require('diff-file-tree')
var ScopedFS = require('scoped-fs')
var anymatch = require('anymatch')
var {join} = require('path')
var fs = require('fs')

module.exports = setup

function setup (archive, stagingPath) {
  // setup staging object
  var staging = new ScopedFS(stagingPath)
  staging.isStaging = true
  staging.path = stagingPath
  staging.diff = (opts, cb) => diffStaging(archive, stagingPath, opts, cb)
  staging.commit = (opts, cb) => commit(archive, stagingPath, opts, cb)
  staging.revert = (opts, cb) => revert(archive, stagingPath, opts, cb)
  staging.startAutoSync = () => archive.metadata.on('append', onAppend)
  staging.stopAutoSync = () => archive.metadata.removeListener('append', onAppend)
  Object.defineProperty(staging, 'key', {get: () => archive.key})
  Object.defineProperty(staging, 'writable', {get: () => archive.writable})

  function onAppend () {
    staging.revert({skipIgnore: true})
  }

  return staging
}

function diffStaging (archive, stagingPath, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = null
  }
  opts = opts || {}
  cb = cb || (() => {})

  readIgnore(stagingPath, opts, function (filter) {
    dft.diff(stagingPath, {fs: archive}, {filter}).then(c => cb(null, c), cb)
  })
}

function commit (archive, stagingPath, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = null
  }
  opts = opts || {}
  cb = cb || (() => {})

  diffStaging(archive, stagingPath, opts, (err, c) => {
    if (err) return cb && cb(err)
    dft.applyRight(stagingPath, {fs: archive}, c).then(() => cb(null, c), cb)
  })
}

function revert (archive, stagingPath, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = null
  }
  opts = opts || {}
  cb = cb || (() => {})

  diffStaging(archive, stagingPath, opts, (err, c) => {
    if (err) return cb && cb(err)
    dft.applyLeft(stagingPath, {fs: archive}, c).then(() => cb(null, c), cb)
  })
}

function readIgnore (stagingPath, opts, cb) {
  if (opts.filter) {
    return cb(opts.filter)
  }
  if (opts.skipIgnore) {
    return done([])
  }

  // read .datignore
  fs.readFile(join(stagingPath, '.datignore'), 'utf8', function (err, rulesRaw) {
    if (err || typeof rulesRaw !== 'string') {
      return done([])
    }

    // massage rules
    done(
      rulesRaw.split('\n')
       .filter(Boolean)
        .map(rule => {
          if (!rule.startsWith('/')) {
            rule = '**/' + rule
          }
          return rule
        })
    )
  })

  function done (rules) {
    cb((path) => anymatch(['/.dat'].concat(rules), path))
  }
}
