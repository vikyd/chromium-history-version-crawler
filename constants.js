exports.OSList = [
  'Mac',
  'Mac_Arm',
  'Win_x64',
  'Win',
  'Linux_x64',
  'Linux',
  'Android',
  // 'Arm',
]

exports.DownloadUrl =
  'https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix='

exports.VersionUrl = 'https://chromium.googlesource.com/chromium/src/+refs'

exports.VersionPositionUrl = 'https://omahaproxy.appspot.com/deps.json?version='

exports.PosReplaceExample = 'prefix=Mac'
exports.PosReplaceStr = 'prefix='
exports.PosQueryPageToken = 'pageToken='

exports.PositionUrl =
  'https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=Mac/&fields=items(kind,mediaLink,metadata,name,size,updated),kind,prefixes,nextPageToken'

exports.PosRegex = /^[0-9]+$/
exports.VerRegex = /^[0-9][0-9.]*[0-9]$/

const FileName = {
  allVersion: 'all-version.json',
  versionPosition: 'version-position.json',
  positionPrefix: 'position-',
  osVerPosPrefix: 'version-position-',
  osVerPosLinkPrefix: 'version-position-link-',
}
exports.FileName = FileName

exports.getPosOsJson = (os) => {
  return `${FileName.positionPrefix}${os}.json`
}
exports.getVerPosOsJson = (os) => {
  return `${FileName.osVerPosPrefix}${os}.json`
}
exports.getVerPosLinkOsJson = (os) => {
  return `${FileName.osVerPosLinkPrefix}${os}.json`
}

exports.Dir = {
  base: 'json',
  verPosOs: 'ver-pos-os',
  verPosOSLink: 'ver-pos-os-link',
  position: 'position',
}
