const should = require("should");

const zapier = require("zapier-platform-core");

const App = require("../../index");
const appTester = zapier.createAppTester(App);

describe("status trigger", () => {
  zapier.tools.env.inject();

  it("should get list of statuses", done => {
    const bundle = {
      authData: {
        api_key: process.env.LINEAR_API_KEY,
      },
      inputData: {
        team_id: "e2fda1a0-b3b7-11e8-a685-8b85f0eec883",
      },
    };
    appTester(App.triggers.status.operation.perform, bundle)
      .then(response => {
        console.log(response);
        response.should.be.an.instanceOf(Array);
        done();
      })
      .catch(done);
  });
});
