'use strict';

const soap = require('soap');

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
      args.splice(1, 0, nodeCallback);
      fn.apply(object, args);
    });
  };
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
      objForEach(methods, (method, fn) => {
        const fnPromised = cb2promise(fn);
        client[service][port][method] = fnPromised;
        client[method] = fnPromised;
      });
    });
  });
  return client;
}

exports.createClient = function (wsdl) {
  const createClient = cb2promise(soap.createClient, soap);
  return createClient(wsdl).then((client) => promisify(client));
};
