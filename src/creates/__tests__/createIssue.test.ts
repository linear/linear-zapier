import { createAppTester, tools } from "zapier-platform-core";

import App from "../../index";
const appTester = createAppTester(App);

describe("create create_issue", () => {
  tools.env.inject();

  it("should create an issue", async () => {
    const bundle = {
      authData: {
        api_key: process.env.LINEAR_API_KEY || "",
      },
      inputData: {
        team_id: process.env.LINEAR_TEAM_ID,
        title: "Test issues",
        description: "Test content",
        state_id: undefined,
        assignee_id: undefined,
      },
    };
    // @ts-ignore
    const res = await appTester(App.creates["create_issue"].operation.perform, bundle);
    expect((res! as any).data.issueCreate.success).toBe(true);
  });
});
