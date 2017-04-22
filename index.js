var assert = require('assert')
var path = require('path')
var fs = require('fs')
var Hyperdrive = require('hyperdrive')
var duplexify = require('duplexify')
var pump = require('pump')
var inherits = require('inherits')
var util = require('./util')
var diffStaging = require('./diff')
var isPathDotDat = util.isPathDotDat

module.exports = StagedHyperdrive

function StagedHyperdrive (stagingPath, key, opts) {
  assert(typeof stagingPath === 'string', 'StagedHyperdrive must be given a string for stagingPath')
  if (!(this instanceof StagedHyperdrive)) return new StagedHyperdrive(stagingPath, key, opts)
  this.stagingPath = stagingPath
  Hyperdrive.call(this, path.join(stagingPath, '.dat'), key, opts)

  // autosync non-owned archives
  var self = this
  this.ready(function () {
    if (!self.writable) {
      self.metadata.on('append', self.revert.bind(self))
    }
  })
}

inherits(StagedHyperdrive, Hyperdrive)

// new methods
// =

StagedHyperdrive.prototype.diffStaging = diffStaging

StagedHyperdrive.prototype.commit = function (cb) {
  cb = cb || function () {}
  var self = this
  this.diffStaging(function (err, diffs) {
    if (err) return cb(err)

    // iterate all diffs
    var i = 0
    next()
    function next (err) {
      if (err) return cb(err)

      // get next diff
      var d = diffs[i++]
      if (!d) return cb(null, diffs)

      // handle each op
      var op = d.change + d.type
      if (op === 'adddirectory') {
        console.log('mkdir', d.name)
        Hyperdrive.prototype.mkdir.call(self, d.name, null, next)
      }
      if (op === 'deldirectory') {
        console.log('rmdir', d.name)
        Hyperdrive.prototype._del.call(self, d.name, next)
      }
      if (op === 'addfile' || op === 'modifyfile') {
        console.log('writeFile', d.name)
        pump(
          fs.createReadStream(util.join(self.stagingPath, d.name)),
          Hyperdrive.prototype.createWriteStream.call(self, d.name),
          next
        )
      }
      if (op === 'delfile') {
        console.log('unlink', d.name)
        Hyperdrive.prototype._del.call(self, d.name, next)
      }
    }
  })
}

StagedHyperdrive.prototype.revert = function (cb) {
  cb = cb || function () {}
  var self = this
  this.diffStaging(function (err, diffs) {
    if (err) return cb(err)

    // iterate all diffs, in reverse
    var i = diffs.length - 1
    next()
    function next (err) {
      if (err) return cb(err)

      // get next diff
      var d = diffs[i--]
      if (!d) return cb(null, diffs)

      // handle each op by doing the opposite action
      var op = d.change + d.type
      if (op === 'adddirectory') {
        console.log('rmdir', d.name)
        fs.rmdir(util.join(self.stagingPath, d.name), next)
      }
      if (op === 'deldirectory') {
        console.log('mkdir', d.name)
        fs.mkdir(util.join(self.stagingPath, d.name), next)
      }
      if (op === 'addfile') {
        console.log('unlink', d.name)
        fs.unlink(util.join(self.stagingPath, d.name), next)
      }
      if (op === 'modifyfile' || op === 'delfile') {
        console.log('writeFile', d.name)
        pump(
          Hyperdrive.prototype.createReadStream.call(self, d.name),
          fs.createWriteStream(util.join(self.stagingPath, d.name)),
          next
        )
      }
    }
  })
}

// wrappers around existing methods
// =

StagedHyperdrive.prototype.createReadStream = function (name, opts) {
  var self = this
  var s = duplexify()
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return s.destroy(new Error('Not allowed to read .dat'))
      s.setReadable(fs.createReadStream(util.join(self.stagingPath, name), opts))
    } else {
      s.setReadable(Hyperdrive.prototype.createReadStream.call(self, name, opts))
    }
  })
  return s
}

StagedHyperdrive.prototype.createWriteStream = function (name, opts) {
  var self = this
  var s = duplexify()
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return s.destroy(new Error('Not allowed to modify .dat'))
      s.setWritable(fs.createWriteStream(util.join(self.stagingPath, name), opts))
    } else {
      s.setWritable(Hyperdrive.prototype.createWriteStream.call(self, name, opts))
    }
  })
  return s
}

StagedHyperdrive.prototype.mkdir = function (name, opts, cb) {
  var self = this
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return cb(new Error('Not allowed to modify .dat'))
      fs.mkdir(util.join(self.stagingPath, name), opts, cb)
    } else {
      Hyperdrive.prototype.mkdir.call(self, name, opts, cb)
    }
  })
}

StagedHyperdrive.prototype.access = function (name, cb) {
  var self = this
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return cb(new Error('Not allowed to access .dat'))
      fs.access(util.join(self.stagingPath, name), cb)
    } else {
      Hyperdrive.prototype.access.call(self, name, cb)
    }
  })
}

StagedHyperdrive.prototype.exists = function (name, cb) {
  var self = this
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return cb(new Error('Not allowed to stat .dat'))
      fs.exists(util.join(self.stagingPath, name), cb)
    } else {
      Hyperdrive.prototype.exists.call(self, name, cb)
    }
  })
}

StagedHyperdrive.prototype.lstat = function (name, cb) {
  var self = this
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return cb(new Error('Not allowed to stat .dat'))
      fs.lstat(util.join(self.stagingPath, name), cb)
    } else {
      Hyperdrive.prototype.lstat.call(self, name, cb)
    }
  })
}

StagedHyperdrive.prototype.stat = function (name, cb) {
  var self = this
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return cb(new Error('Not allowed to stat .dat'))
      fs.stat(util.join(self.stagingPath, name), cb)
    } else {
      Hyperdrive.prototype.stat.call(self, name, cb)
    }
  })
}

StagedHyperdrive.prototype.readdir = function (name, cb) {
  var self = this
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return cb(new Error('Not allowed to readdir .dat'))
      fs.readdir(util.join(self.stagingPath, name), function (err, names) {
        if (names && (!name || name === '/' || name === '.')) {
          // filter out .dat
          names = names.filter(n => n !== '.dat')
        }
        cb(err, names)
      })
    } else {
      Hyperdrive.prototype.readdir.call(self, name, cb)
    }
  })
}

StagedHyperdrive.prototype.unlink = function (name, cb) {
  var self = this
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return cb(new Error('Not allowed to unlink .dat'))
      fs.unlink(util.join(self.stagingPath, name), cb)
    } else {
      Hyperdrive.prototype.unlink.call(self, name, cb)
    }
  })
}

StagedHyperdrive.prototype.rmdir = function (name, cb) {
  var self = this
  this.ready(function () {
    if (self.writable) {
      if (isPathDotDat(name)) return cb(new Error('Not allowed to rmdir .dat'))
      fs.rmdir(util.join(self.stagingPath, name), cb)
    } else {
      Hyperdrive.prototype.rmdir.call(self, name, cb)
    }
  })
}
