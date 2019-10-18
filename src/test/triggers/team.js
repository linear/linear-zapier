const should = require("should");

const zapier = require("zapier-platform-core");

const App = require("../../index");
const appTester = zapier.createAppTester(App);

describe("team trigger", () => {
  zapier.tools.env.inject();

  it("should get list of teams", done => {
    const bundle = {
      authData: {
        api_key: process.env.LINEAR_API_KEY,
      },
      inputData: {},
    };
    appTester(App.triggers.team.operation.perform, bundle)
      .then(response => {
        response.should.be.an.instanceOf(Array);
        done();
      })
      .catch(done);
  });
});
