# soap-as-promised [![Circle CI](https://circleci.com/gh/warseph/soap-as-promised.svg?style=svg)](https://circleci.com/gh/warseph/soap-as-promised)

Convert all [node-soap](https://github.com/vpulim/node-soap) methods to promises. Inspired by soap-q, but it doesn't add
any suffix to methods, the client has the same interface as exposed by the original soap module.

## Installation
`npm install soap-as-promised`

## Usage
```js
const soap = require('soap-as-promised');

soap.createClient('http://example.org/wsdl')
    .then((client) => client.myAwesomeSoapMethod({param: true}))
    .then((result) => console.log(`The result was: ${result}`))
    .catch((error) => console.error(`There was an error! ${error}`));
```

## Important!

There are a couple of things that behave different from the original soap client:

* Null responses return an object with like this `{return: null, _rawResponse: "<SOAP RETURNED BY THE SERVICE>"}`
* String responses return an object like this: `{return: 'String response', _rawResponse: "<SOAP RETURNED BY THE SERVICE>"}`
* When specifying endpoint as an extra parameter you need to pass the options parameter (at least `null` or `{}`)
