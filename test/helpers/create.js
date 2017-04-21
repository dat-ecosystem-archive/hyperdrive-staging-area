var fs = require('fs')
var os = require('os')
var path = require('path')
var hyperdrive = require('../../')

function mktmpdir () {
  if (fs.mkdtempSync) {
    return fs.mkdtempSync(os.tmpdir() + path.sep + 'staged-hyperdrive-test-')
  }
  var p = (os.tmpdir() + path.sep + 'staged-hyperdrive-test-' + Date.now())
  fs.mkdirSync(p)
  return p
}

module.exports = function (key, opts) {
  return hyperdrive(mktmpdir(), key, opts)
}
