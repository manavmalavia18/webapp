// 
const app = require('../index.js').app;
const { describe, it } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;

chai.use(chaiHttp);

describe('CI Testing for GET/healthz', () => {
  it('Successfully check the Db connection', async () => {
    try {
      const response = await chai.request(app).get('/healthz');
      expect(response).to.have.status(200);
    } catch (error) {
      console.error('Test Error:', error);
      expect.fail('Database connection failed');
    }
  });
});
