const fs = require('fs')
const path = require('path')
const got = require('got')

const {
  OSList,
  PosReplaceExample,
  PosReplaceStr,
  PosQueryPageToken,
  getPosOsJson,
  PositionUrl,
  PosRegex,
  Dir,
} = require('./constants')

main()

// about sort: https://stackoverflow.com/a/38641281/2752670
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

async function main() {
  let promiseAll = []
  OSList.forEach((os) => {
    promiseAll.push(doIt(os))
  })
  await Promise.all(promiseAll)
  // for (let i = 0; i < 1; i++) {
  //   await doIt('Mac')
  // }
}

async function doIt(os, posArr, pageToken) {
  try {
    if (!posArr) {
      posArr = []
    }
    let url = PositionUrl.replace(PosReplaceExample, `${PosReplaceStr}${os}`)
    if (pageToken) {
      url = `${url}&${PosQueryPageToken}${pageToken}`
    }
    const resp = await got(url)
    const json = JSON.parse(resp.body)
    if (!json.prefixes) {
      console.log(`${os} no prefixes`)
      return
    }
    json.prefixes.forEach((item) => {
      const arr = item.split('/')
      if (arr.length < 2) {
        console.log(`${os} position not correct: ${item}`)
        return
      }
      const posStr = arr[1]
      if (!PosRegex.test(posStr)) {
        console.log(`${os} position not correct: ${item}`)
        return
      }
      posArr.push(posStr)
    })

    console.log(url)
    console.log(`${os} success count: ${posArr.length}`)
    console.log('-------------------------------')

    if (json.nextPageToken) {
      return doIt(os, posArr, json.nextPageToken)
    } else {
      posArr.sort((a, b) => collator.compare(a, b))
      const posDir = path.join(Dir.base, Dir.position)
      if (!fs.existsSync(posDir)) {
        fs.mkdirSync(posDir, { recursive: true })
      }

      fs.writeFileSync(
        path.join(posDir, getPosOsJson(os)),
        JSON.stringify(posArr, null, 2)
      )
      console.log(`${os} finish all -----------------------------`)
      return posArr
    }
  } catch (e) {
    console.log(e)
  }
}
