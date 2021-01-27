const fs = require('fs')
const path = require('path')

const {
  OSList,
  PosRegex,
  getVerPosOsJson,
  getVerPosLinkOsJson,
  getPosOsJson,
  Dir,
  FileName,
  DownloadUrl,
} = require('./constants')

const osVerPosDir = path.join(Dir.base, Dir.verPosOs)

main()

function main() {
  let VerPosMap = fs.readFileSync(
    path.join(Dir.base, FileName.versionPosition),
    'utf8'
  )
  VerPosMap = JSON.parse(VerPosMap)
  Object.keys(VerPosMap).forEach((ver) => {
    const pos = VerPosMap[ver]
    // remove invalid format
    if (!PosRegex.test(pos)) {
      delete VerPosMap[ver]
    }
  })

  OSList.forEach((os) => {
    let PosArr = fs.readFileSync(
      path.join(Dir.base, Dir.position, getPosOsJson(os)),
      'utf8'
    )
    PosArr = JSON.parse(PosArr)
    let posMap = {}
    PosArr.filter((pos) => PosRegex.test(pos)).forEach((pos) => {
      posMap[pos] = pos
    })

    let verPosMap = {}
    Object.keys(VerPosMap).forEach((ver) => {
      const pos = VerPosMap[ver]
      if (posMap[pos]) {
        verPosMap[ver] = pos
      }
    })
    if (!fs.existsSync(osVerPosDir)) {
      fs.mkdirSync(osVerPosDir, { recursive: true })
    }

    fs.writeFileSync(
      path.join(osVerPosDir, getVerPosOsJson(os)),
      JSON.stringify(verPosMap, null, 2)
    )

    const verPosLinkMap = Object.keys(verPosMap).reduce((all, item) => {
      const pos = verPosMap[item]
      all[item] = `${DownloadUrl}${os}/${pos}/`
      return all
    }, {})
    const osVerPosLinkDir = path.join(Dir.base, Dir.verPosOSLink)
    if (!fs.existsSync(osVerPosLinkDir)) {
      fs.mkdirSync(osVerPosLinkDir, { recursive: true })
    }
    fs.writeFileSync(
      path.join(osVerPosLinkDir, getVerPosLinkOsJson(os)),
      JSON.stringify(verPosLinkMap, null, 2)
    )

    console.log(`${os} finish all -----------------------------`)
  })
}
