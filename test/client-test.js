'use strict';

const http = require('http');
const fs = require('fs');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const soap = require('..');
const expect = chai.expect;
chai.use(chaiAsPromised);

const WSDL = __dirname + '/files/test.wsdl';
const RESPONSE_XML = __dirname + '/files/response.xml';
const RESPONSE = fs.readFileSync(RESPONSE_XML).toString().trim();
const EMPTY_RESPONSE_XML = __dirname + '/files/empty-response.xml';
const EMPTY_RESPONSE = fs.readFileSync(EMPTY_RESPONSE_XML).toString().trim();
const HOST = 'localhost';
const PORT = 65534;
const BASE_URL = `http://${HOST}:${PORT}`;

describe('Promisified client', function() {
  let server;
  describe('With response', function () {
    before(function (done) {
      server = http.createServer(function (req, res) {
        res.statusCode = 200;
        res.write(RESPONSE, 'utf8');
        res.end();
      });
      server.listen(PORT, HOST, done);
    });
    after(function (done) {
      server.close(done);
    });

    it('should return a promised client', function () {
      const client = soap.createClient(WSDL);
      return expect(client).to.eventually.have.property('MyOperation');
    });

    it('should return the promised result', function () {
      const response = soap.createClient(WSDL, {}, BASE_URL)
      .then(c => c.MyOperation({}))
      .then(r => r.Response);
      return expect(response).to.eventually.eq('Test response');
    });

    it('should return the raw result', function () {
      const rawResponse = soap.createClient(WSDL, {}, BASE_URL)
      .then(c => c.MyOperation({}))
      .then(r => r._rawResponse.trim());

      return expect(rawResponse).to.eventually.eq(RESPONSE);
    });
  });

  describe('Without response', function () {
    before(function (done) {
      server = http.createServer(function (req, res) {
        res.statusCode = 200;
        res.write(EMPTY_RESPONSE, 'utf8');
        res.end();
      });
      server.listen(PORT, HOST, done);
    });
    after(function (done) {
      server.close(done);
    });
    it('should return the raw result even if it is an empty response', function () {
      const rawResponse = soap.createClient(WSDL, {empty: 'true'}, BASE_URL)
      .then(c => c.MyEmptyOperation({}))
      .then(r => r._rawResponse.trim());

      return expect(rawResponse).to.eventually.eq(EMPTY_RESPONSE);
    });
  });

  it('should fail on method call when setEndpoint has a bad url', () => {
      const promise = soap.createClient(WSDL)
          .then(client => {
              client.setEndpoint("http://localhost:" + (PORT-1));
              return client.MyEmptyOperation();
          });
      return expect(promise).to.be.rejected;
    });

});
