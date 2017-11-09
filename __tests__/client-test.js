'use strict';

const http = require('http');
const fs = require('fs');
const soap = require('../soap-as-promised');

const WSDL = `${__dirname}/files/test.wsdl`;
const RESPONSE_XML = `${__dirname}/files/response.xml`;
const RESPONSE = fs.readFileSync(RESPONSE_XML).toString().trim();
const EMPTY_RESPONSE_XML = `${__dirname}/files/empty-response.xml`;
const EMPTY_RESPONSE = fs.readFileSync(EMPTY_RESPONSE_XML).toString().trim();
const STRING_RESPONSE_XML = `${__dirname}/files/string-response.xml`;
const STRING_RESPONSE = fs.readFileSync(STRING_RESPONSE_XML).toString().trim();
const HOST = 'localhost';
const PORT = 65534;
const BASE_URL = `http://${HOST}:${PORT}`;

describe('Promisified client', () => {
  let server;
  describe('With response', () => {
    beforeEach(done => {
      server = http.createServer((req, res) => {
        res.statusCode = 200;
        res.write(RESPONSE, 'utf8');
        res.end();
      });
      server.listen(PORT, HOST, done);
    });

    afterEach(done => {
      server.close(done);
    });

    it('should return a promised client', () => {
      const client = soap.createClient(WSDL);
      return expect(client).resolves.toHaveProperty('MyOperation');
    });

    it('should return the promised result', () => {
      const response = soap.createClient(WSDL, {}, BASE_URL)
        .then(c => c.MyOperation({}))
        .then(r => r.Response);
      return expect(response).resolves.toEqual('Test response');
    });

    it('should return the raw result', () => {
      const rawResponse = soap.createClient(WSDL, {}, BASE_URL)
        .then(c => c.MyOperation({}))
        .then(r => r._rawResponse.trim());

      return expect(rawResponse).resolves.toEqual(RESPONSE);
    });

    it('should postprocess the result', () => {
      const mock = jest.fn();
      return soap.createClient(WSDL, {}, BASE_URL)
        .then(c => c.MyOperation({}, { postProcess: mock }))
        .then(() => expect(mock).toHaveBeenCalled());
    });
  });

  describe('Without response', () => {
    beforeEach(done => {
      server = http.createServer((req, res) => {
        res.statusCode = 200;
        res.write(EMPTY_RESPONSE, 'utf8');
        res.end();
      });
      server.listen(PORT, HOST, done);
    });

    afterEach(done => {
      server.close(done);
    });

    it('should return the raw result even if it is an empty response', () => {
      const rawResponse = soap.createClient(WSDL, {empty: 'true'}, BASE_URL)
        .then(c => c.MyEmptyOperation({}))
        .then(r => r._rawResponse.trim());

      return expect(rawResponse).resolves.toEqual(EMPTY_RESPONSE);
    });
  });

  describe('String response', () => {
    beforeEach(done => {
      server = http.createServer((req, res) => {
        res.statusCode = 200;
        res.write(STRING_RESPONSE, 'utf8');
        res.end();
      });
      server.listen(PORT, HOST, done);
    });

    afterEach(done => {
      server.close(done);
    });

    it('should wrap the string in an object if it is a string response', () => {
      const rawResponse = soap.createClient(WSDL, {}, BASE_URL)
        .then(c => c.MyOperation({}))
        .then(r => r._rawResponse.trim());

      return expect(rawResponse).resolves.toEqual(STRING_RESPONSE);
    });
  });

  it('should fail on method call when setEndpoint has a bad url', () => {
    const promise = soap.createClient(WSDL)
      .then(client => {
        client.setEndpoint(`http://localhost:${PORT - 1}`);
        return client.MyEmptyOperation();
      });
    return expect(promise).rejects.toBeDefined();
  });
});
