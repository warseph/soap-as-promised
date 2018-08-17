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
const HOST = 'localhost';
const PORT = 65534;
const BASE_URL = `http://${HOST}:${PORT}`;

describe('Promisified client', function() {
  let server;

  before(function (done) {
    server = http.createServer(function (req, res) {
      var status_value = (req.headers['test-header'] === 'test') ? 'pass' : 'fail';
      res.setHeader('status', status_value);
      res.statusCode = 200;
      res.write(RESPONSE, 'utf8');
      res.end();
    });
    server.listen(PORT, HOST, done);
  });
  after(function (done) {
    server.close(done);
  })

  it('should return a promised client', function () {
    const client = soap.createClient(WSDL);
    return expect(client).to.eventually.have.property('MyOperation');
  });

  it('should return the promised result', async () => {
    const client = await soap.createClient(WSDL, {}, BASE_URL);
    const result = await client.MyOperation({});
    expect(result.Response).to.eq('Test response');
  });

  it('should return the promised result after an endpoint change', async () => {
    const client = await soap.createClient(WSDL, {}, BASE_URL);
    client.setEndpoint(BASE_URL);
    const result = await client.MyOperation({});
    expect(result.Response).to.eq('Test response');
  });

  it('should return the raw result', async () => {
    const client = await soap.createClient(WSDL, {}, BASE_URL);
    const result = await client.MyOperation({});
    const rawResponse = result._rawResponse.trim();
    expect(rawResponse).to.eq(RESPONSE);
  });
});
