function isWindows() {
  return process.platform === 'win32';
}

function isOSX() {
  return process.platform === 'darwin';
}

function isLinux() {
  return !(isWindows() || isOSX());
}

module.exports = { isWindows, isOSX, isLinux };
