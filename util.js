var path = require('path')

var UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/

module.exports.join = function (rootpath, subpath) {
  // make sure they're not using '..' to get outside of rootpath
  if (UP_PATH_REGEXP.test(path.normalize('.' + path.sep + subpath))) {
    return false
  }
  return path.normalize(path.join(rootpath, subpath))
}

module.exports.isPathDotDat = function (subpath) {
  subpath = path.normalize('.' + path.sep + subpath)
  return (subpath === '.dat' || subpath.startsWith('.dat/'))
}
