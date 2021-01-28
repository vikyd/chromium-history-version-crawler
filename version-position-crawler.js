const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const got = require('got')
const Crawler = require('crawler')
const { getopt } = require('stdio')
const {
  VersionUrl,
  VersionPositionUrl,
  FileName,
  Dir,
  VerRegex,
} = require('./constants')

const Modes = {
  inc: 'inc',
  all: 'all',
}

const AllDefaultOpts = {
  mode: Modes.inc,
  maxConnections: 10,
  loopTimes: 10,
  loopInterval: 5,
}

const IncDefaultOpts = {
  mode: Modes.inc,
  maxConnections: 3,
  loopTimes: 3,
  loopInterval: 3,
}

const receivedOpts = getopt({
  mode: {
    key: 'm',
    description:
      '`all`: first crawl positions of all version, or `inc`: incremental mode(much less request and less error)',
    default: Modes.inc,
  },
  maxConnections: {
    key: 'c',
    description:
      'max connections of crawling positions, default `all`: 10, `inc`: 3',
  },
  loopTimes: {
    key: 'l',
    description:
      'times to loop all needed fetch versions, default `all`: 10, `inc`: 3',
  },
  loopInterval: {
    key: 'i',
    description: 'seconds between each loop, default `all`: 5, `inc`: 3',
  },
  beginVerIndex: {
    key: 'b',
    default: 0,
  },
  saveStepSize: {
    key: 's',
    description:
      'used for `all` only, save to file after this count of request',
    default: 1000,
  },
})

let opts =
  receivedOpts.mode === Modes.all
    ? { ...AllDefaultOpts }
    : { ...IncDefaultOpts }
opts = { ...opts, ...receivedOpts }

// entry
main()

async function main() {
  if (!fs.existsSync(Dir.base)) {
    fs.mkdirSync(Dir.base, { recursive: true })
  }
  if (opts.mode === Modes.all) {
    console.log('mode: all')
    await mainFirstFull()
  } else {
    console.log('mode: increment')
    await mainIncreace()
  }
  console.log('all finished --------------------')
}

// -------------------------

async function mainIncreace() {
  for (let i = 1; i <= opts.loopTimes; i++) {
    console.log(`round ${i} begin ...`)
    try {
      const isFinish = await doIt(opts.beginVerIndex)
      if (isFinish) {
        break
      }
    } catch (e) {
      console.error(e)
    }
    await sleep(opts.loopInterval * 1000)
    console.error(`round ${i} end ---------------`)
  }
}

async function mainFirstFull() {
  for (let i = 1; i <= opts.loopTimes; i++) {
    console.log(`round ${i} begin ...`)
    const MaxVerCount = 30000
    const halfStep = Math.floor(opts.saveStepSize / 2)
    for (let j = opts.beginVerIndex; j < MaxVerCount; j += halfStep) {
      try {
        await doIt(j)
      } catch (e) {
        console.error(e)
      }
    }
    await sleep(opts.loopInterval * 1000)
    console.error(`round ${i} end ---------------`)
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// about sort: https://stackoverflow.com/a/38641281/2752670
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

async function doIt(beginIdx) {
  const resp = await got(VersionUrl)
  const $ = cheerio.load(resp.body)
  const $titles = $('.RefList-title')
  let $RefListItems = []
  $titles.each(function (i, item) {
    const $item = $(this)
    const text = $item.text()
    console.log(`version page: ${text}`)
    if (text === 'Tags') {
      $RefListItems = $item.next().children('li')
    }
  })
  if ($RefListItems.length === 0) {
    console.error('no version data')
    return false
  }
  console.log(`version count raw: ${$RefListItems.length}`)

  let versions = []
  $RefListItems.each(function (i, item) {
    const $item = $(this)
    const ver = $item.text()
    const v = ver.trim()
    if (VerRegex.test(v)) {
      versions.push(ver.trim())
    } else {
      console.log(`invalid version: ${ver}`)
    }
  })
  console.log(`version count valid: ${versions.length}`)
  versions.sort((a, b) => collator.compare(b, a))
  fs.writeFileSync(
    path.join(Dir.base, FileName.allVersion),
    JSON.stringify(versions, null, 2)
  )

  // ---- begin to find position ---------------
  let verPosMap = {}
  const crawler = new Crawler({
    jQuery: false,
    maxConnections: 3,
    // This will be called for each crawled data
    callback: function (error, res, done) {
      if (error) {
        console.log(error)
        done()
        return
      }
      let $ = res.$
      let bodyObj = ''
      const v = res.options.myData
      if (res.body.includes('Traceback')) {
        console.log(`----- ${v} ---- ${res.body} ----`)
        verPosMap[v] = 'ErrorWithTraceback'
        done()
        return
      }
      try {
        bodyObj = JSON.parse(res.body)
      } catch (e) {
        console.log(`----- ${v} ---- ${res.body} ----`)
        done()
        return
      }
      const pos = bodyObj.chromium_base_position
      if (!pos) {
        // `null` pos will also be recorded
        // `null` pos is not changed after any times of request
        console.log(`version ${v} position ${pos}`)
      } else {
        console.log(`version ${v} match position ${pos}`)
      }
      verPosMap[v] = pos
      done()
    },
  })

  // read cached json, can avoid lots of request
  const oldVerPosStr = fs.readFileSync(
    path.join(Dir.base, FileName.versionPosition),
    'utf8'
  )
  const oldVerPosMap = JSON.parse(oldVerPosStr)
  versions = versions.filter((v) => !oldVerPosMap.hasOwnProperty(v))

  const needToFetchCount = versions.length
  console.log(`need to fetch count: ${needToFetchCount}`)

  if (versions.length === 0) {
    return true
  }

  let count = 0
  for (let i = beginIdx; i < versions.length; i++) {
    const v = versions[i]
    if (i === 1) {
      console.log(`first fetch version: ${v}`)
    }
    const url = `${VersionPositionUrl}${v}`
    crawler.queue({ uri: url, myData: v })
    count++
    if (opts.mode === Modes.all) {
      // each step size save to file, in case of loss of crawled data
      if (count >= opts.saveStepSize) {
        break
      }
    }
  }

  return await new Promise((resolve, reject) => {
    crawler.on('drain', function () {
      console.log('crawler drain event')
      let allVerPosMap = Object.assign({}, oldVerPosMap, verPosMap)
      const successCount =
        Object.keys(allVerPosMap).length - Object.keys(oldVerPosMap).length
      console.log(`success count: ${successCount}`)

      // sort keys
      allVerPosMap = Object.entries(allVerPosMap)
        .sort((a, b) => collator.compare(b, a))
        .reduce((o, [k, v]) => ((o[k] = v), o), {})
      fs.writeFileSync(
        path.join(Dir.base, FileName.versionPosition),
        JSON.stringify(allVerPosMap, null, 2)
      )

      const FName = __filename.slice(__dirname.length + 1)
      console.log(`${FName}: finish`)

      // remember to resolve
      resolve(successCount === needToFetchCount)
    })
  })
}
