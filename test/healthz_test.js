const app = require('../index.js').app;
const { describe, it } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { dbconnect } = require('../connection');

const { expect } = chai;

chai.use(chaiHttp);

describe("CI Testing for GET/healthz", () => {
  it("Successfully check the Db connection", async function() {
    this.timeout(5000); // Set a longer timeout (e.g., 5000ms) for this test

    let dbstatus = true;

    try {
      dbconnect();
      const response = await chai.request(app).get("/healthz");
      expect(response).to.have.status(200);
    } catch (error) {
      console.error("Test Error:", error);
      dbstatus = false;
      expect(dbstatus, "Database connection failed").to.be.true;
    } finally {
      setTimeout(() => {
        process.exit(0); 
      }, 3000); // 
    }
  });
});

