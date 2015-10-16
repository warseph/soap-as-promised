# soap-as-promised
Convert all [node-soap](https://github.com/vpulim/node-soap) methods to promises. Inspired by soap-q, but it doesn't add
any suffix to methods, the client has the same interface as exposed by the original soap module.

## Installation
`npm install soap-as-promised`

## Usage
```js
const soap = require('soap-as-promised');

soap.createClient('http://example.org/wsdl')
    .then((client) => client.myAwesomeSoapMethod({param: true}))
    .then((result) => console.log("The result was: #{result}"))
    .catch((error) => console.error("There was an error! #{error}"));
```
