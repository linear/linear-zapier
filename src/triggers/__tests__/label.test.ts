import { createAppTester, tools } from "zapier-platform-core";

import App from "../../index";
const appTester = createAppTester(App);

describe("label trigger", () => {
  tools.env.inject();

  it("should get list of issues labels", async () => {
    const bundle = {
      authData: {
        api_key: process.env.LINEAR_API_KEY || "",
      },
      inputData: {
        team_id: process.env.LINEAR_TEAM_ID || "",
      },
    };
    const res = await appTester(App.triggers.label.operation.perform, bundle);
    expect(res).toBeInstanceOf(Array);
  });
});
