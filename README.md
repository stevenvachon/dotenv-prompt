# dotenv-prompt [![NPM Version][npm-image]][npm-url] [![Linux Build][travis-image]][travis-url] [![Windows Build][appveyor-image]][appveyor-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Monitor][greenkeeper-image]][greenkeeper-url]

> Create and edit `.env` files via CLI prompts.


## Installation

[Node.js](http://nodejs.org) `>= 6` is required. To install, type this at the command line:
```shell
npm install dotenv-prompt
```

## Usage

A dual file convention is used, consisting of `.env.sample` and `.env`. Both file names and the paths to them can be customized.

`.env.sample` should contain a template of default values for environmental variables. This file should be committed to your project's repository. Here is an example of such a file:

```
SOME_VAR=alue

# Comment
ANOTHER_VAR=another value
```

### `dotenvPrompt(envPath=".env", envSamplePath=".env.sample", varnames=[])`

This function will read the contents of the file at `envSamplePath` if the file at `envPath` does not exist. Regardless of which is used, each variable name found within will be prompted for a value.

Optionally, you can specify exactly which should be prompted via `varnames`.

When all prompts have been answered, a new file will be written (or overwritten) at `envPath`. Any other custom changes made to the pre-existing file will be preserved.

```js
const dotenvPrompt = require('dotenv-prompt');

dotenvPrompt().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```


[npm-image]: https://img.shields.io/npm/v/dotenv-prompt.svg
[npm-url]: https://npmjs.org/package/dotenv-prompt
[travis-image]: https://img.shields.io/travis/stevenvachon/dotenv-prompt.svg?label=linux/osx
[travis-url]: https://travis-ci.org/stevenvachon/dotenv-prompt
[appveyor-image]: https://img.shields.io/appveyor/ci/stevenvachon/dotenv-prompt.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/stevenvachon/dotenv-prompt
[coveralls-image]: https://img.shields.io/coveralls/stevenvachon/dotenv-prompt.svg
[coveralls-url]: https://coveralls.io/github/stevenvachon/dotenv-prompt
[greenkeeper-image]: https://badges.greenkeeper.io/stevenvachon/dotenv-prompt.svg
[greenkeeper-url]: https://greenkeeper.io/
