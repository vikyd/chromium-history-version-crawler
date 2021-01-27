# chromium-history-version-crawler

Crawlers to produce Chromium versions mapping to `chromium_base_position`.

Result JSON data: https://github.com/vikyd/chromium-history-version-position

View page: https://vikyd.github.io/download-chromium-history-version/

[TOC]

# Steps

All output json files locate in `json` folder.

## Step1

Find all available Chromiunm versions, then find the `chromium_base_position` of each version. And genrate: `all-version.json`, `version-position.json` .

```sh
# doc: `node version-position-crawler.js -h`
# `all mode` or `incremental mode`
node version-position-crawler.js
```

`all-version.json`:

```json
[
  "90.0.4399.1",
  "90.0.4399.0",
  "90.0.4398.1",
  "90.0.4398.0"
  // ...
]
```

`version-position.json`:

```json
{
  "90.0.4399.1": "846615",
  "90.0.4399.0": "846615",
  "90.0.4398.1": "846545",
  "90.0.4398.0": "846545"
  // ...
}
```

## Step2

Find all available Chromiunm `chromium_base_position` of each OS. And generate: `position/position-Mac.json` etc.

```sh
node position-crawler.js
# about 90 seconds
```

`position-Mac.json`:

```json
[
  "15734",
  "15749",
  "15839",
  "15942"
  // ...
]
```

## Step3

Compare `version-position.json` and each `position/position-os.json`, extract the intersection of the `chromium_base_position`, generate the final json files: `version-position-Mac.json` etc.

```sh
node ver-pos-os-generator.js
```

`Mac-ver-pos.json`:

```json
{
  "90.0.4398.1": "846545",
  "90.0.4398.0": "846545",
  "90.0.4396.2": "845872",
  "90.0.4396.1": "845872"
  // ...
}
```

# json steps

```
all-version.json -> version-position.json ->
                                              -> ver-pos-[os].json
                       position-[os].json ->
```

# Full mode

It is hard to fetch all position successfully at one loop.

If you really want a full fetch, you may need to modify parameters in the js file.

# Missing data

Because of some problems of the position api:

- data OK: https://omahaproxy.appspot.com/deps.json?version=87.0.4253.0
- no data: https://omahaproxy.appspot.com/deps.json?version=33.0.1733.0

Most version before v38.0.0.0 is missing.
