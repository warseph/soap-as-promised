Q = require 'q'
soap = require 'soap'

isDefault = (p) ->
  ['_initializeServices', '_defineService', '_definePort', '_defineMethod', '_invoke',
  'describe', 'setSecurity', 'setSOAPAction', 'setEndpoint', 'addSoapHeader'].indexOf(p) == -1

promisify = (client) ->
  return client if client._promisified
  client._promisified = true
  isFunction = (p) -> 'function' == typeof client[p]
  for property of client
    if isFunction(property) and isDefault(property)
      client[property] = Q.nbind client[property], client
  client

module.exports = ->
  createClient: (wsdl) ->
    Q.ninvoke(soap, 'createClient', wsdl).then (client) -> promisify client
