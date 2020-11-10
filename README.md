# stream-line-reader

Read through a stream of lines on-demand

[![npm stats](https://nodei.co/npm/stream-line-reader.png?compact=true)](http://npmjs.com/package/stream-line-reader)

[![CI status](https://img.shields.io/github/workflow/status/zenflow/stream-line-reader/CI?logo=GitHub&label=CI)](https://github.com/zenflow/stream-line-reader/actions?query=branch%3Amaster)
[![dependencies status](https://img.shields.io/david/zenflow/stream-line-reader)](https://david-dm.org/zenflow/stream-line-reader)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/zenflow/stream-line-reader?logo=Code%20Climate)](https://codeclimate.com/github/zenflow/stream-line-reader)
[![Known Vulnerabilities](https://snyk.io/test/github/zenflow/stream-line-reader/badge.svg?targetFile=package.json)](https://snyk.io/test/github/zenflow/stream-line-reader?targetFile=package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

## Installation

```
$ npm install stream-line-reader
```

## Usage

```js
const { spawn } = require('child_process');
const { StreamLineReader } = require('stream-line-reader');

async function example () {
  const child = spawn('my-calculator-program');
  const lines = new StreamLineReader(child.stdout);

  console.log(await lines.readUntil('Done startup'));
  // -> ['Starting...', 'Done startup']

  child.stdin.write('1+2\n');
  console.log(await lines.readUntil(/^Answer:/));
  // -> ['Question: 1+2', 'Calculating...', 'Answer: 3']

  child.stdin.write('3+4\n');
  console.log(await lines.readUntil(line => line.startsWith('Answer:')));
  // -> ['Question: 3+4', 'Calculating...', 'Answer: 7']

  child.stdin.end();
  console.log(await lines.readRemaining());
  // -> ['Bye!', '', '']
}

```

Instance can be created with a single stream, or an array of streams,
in which case they are merged (interleaved), to be read as one stream.

If during a call to `.readUntil()` the stream ends without emitting a matching line,
an error will be raised with details for debugging.

Instances also have a `.readBuffered()` method for when some time has passed
and you just want to read whatever lines have become available.
It takes no arguments and returns synchronously an array of lines.
