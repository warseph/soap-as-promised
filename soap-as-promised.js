'use strict';

const soap = require('soap');

const functions = [
  '_initializeServices', '_defineService', '_definePort',
  '_defineMethod', '_invoke', 'describe', 'setSecurity',
  'setSOAPAction', 'setEndpoint', 'addSoapHeader'
];

const isDefault = (p) => functions.indexOf(p) === -1;
const isFunction = (val) => 'function' === typeof val;

function cb2promise(fn, object) {
  return function () {
    const args = [].slice.call(arguments, 0);
    return new Promise((resolve, reject) => {
      function nodeCallback(err, value) {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      }
      args.push(nodeCallback);
      fn.apply(object, args);
    });
  };
}

function promisify(client) {
  if (client._promisified === true) {
    return client;
  }

  client._promisified = true;
  for (let property in client) {
    if (isFunction(client[property]) && isDefault(client[property])) {
      client[property] = cb2promise(client[property], client);
    }
  }
  return client;
}

exports.createClient = function (wsdl) {
  const createClient = cb2promise(soap.createClient, soap);
  return createClient(wsdl).then((client) => promisify(client));
};
