'use strict';

const soap = require('soap');

function cb2promise(fn, bind, position) {
  if (fn._promisified === true) {
    return fn;
  }
  const promisifiedFn =  function () {
    const args = [].slice.call(arguments, 0);
    return new Promise((resolve, reject) => {
      function nodeCallback(err, result, raw) {
        if (err) {
          reject(err);
        } else {
          result._rawResponse = raw;
          resolve(result);
        }
      }
      if (position !== undefined) {
        args.splice(position, 0, nodeCallback);
      } else {
        args.push(nodeCallback);
      }
      fn.apply(bind, args);
    });
  };
  promisifiedFn._promisified = true;
  return promisifiedFn;
}

function objForEach(obj, fn) {
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      fn(prop, obj[prop]);
    }
  }
}

function promisify(client) {
  if (client._promisified === true) {
    return client;
  }

  client._promisified = true;
  const services = client.describe();

  objForEach(services, (service, ports) => {
    objForEach(ports, (port, methods) => {
      objForEach(methods, (method) => {
        const fn = client[service][port][method].bind(client[service][port]);
        const fnPromised = cb2promise(fn, client, 1);
        client[service][port][method] = fnPromised;
        client[method] = fnPromised;
      });
    });
  });
  return client;
}
const originalCreateClient = soap.createClient;

module.exports = Object.assign(soap, {
  createClient: function () {
    const args = [].slice.call(arguments, 0);
    const createClient = cb2promise(originalCreateClient, soap);
    return createClient.apply(null, args).then((client) => promisify(client));
  }
});
