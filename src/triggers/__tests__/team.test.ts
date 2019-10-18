import { createAppTester, tools } from "zapier-platform-core";

import App from "../../index";
const appTester = createAppTester(App);

describe("team trigger", () => {
  tools.env.inject();

  it("should get list of teams", async () => {
    const bundle = {
      authData: {
        api_key: process.env.LINEAR_API_KEY || "",
      },
      inputData: {},
    };
    const res = await appTester(App.triggers.team.operation.perform, bundle);
    expect(res).toBeInstanceOf(Array);
  });
});
