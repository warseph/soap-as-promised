'use strict';

const soap = require('soap');

function cb2promise(fn, bind, position) {
  if (fn._promisified === true) {
    return fn;
  }
  const promisifiedFn = function () {
    const args = [].slice.call(arguments, 0);
    return new Promise((resolve, reject) => {
      function nodeCallback(err, result, raw) {
        if (err) {
          reject(err);
        } else {
          if (!result) {
            result = {return: null};
          }
          if (typeof result !== 'object') {
            result = { return: result };
          }
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
  for (const prop in obj) {
    // eslint-disable-next-line no-prototype-builtins
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
  if (!client._promisifiedSetEndpoint) {
    client._promisifiedSetEndpoint = true;
    const originalSetEndpoint = client.setEndpoint;
    client.setEndpoint = function () {
      const result = originalSetEndpoint.apply(client, arguments);
      client._promisified = false;
      promisify(client);
      return result;
    };
  }
  return client;
}
const originalCreateClient = soap.createClient;

module.exports = Object.assign(soap, {
  createClient() {
    const args = [].slice.call(arguments, 0);
    const createClient = cb2promise(originalCreateClient, soap, 2);
    return createClient.apply(null, args).then((client) => promisify(client));
  }
});
