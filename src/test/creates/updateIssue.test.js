const zapier = require("zapier-platform-core");
const App = require("../../../index");

const appTester = zapier.createAppTester(App);
const perform = App.creates.updateIssue.operation.perform;

describe("creates.updateIssue", () => {
  it("sends null for dueDate when the raw clear field key is provided", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: {
        data: {
          issueUpdate: {
            success: true,
            issue: {
              id: "issue-id",
              identifier: "LIN-1",
              title: "Issue title",
              url: "https://linear.app/test/issue/LIN-1/issue-title",
            },
          },
        },
      },
    });

    await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: {
          api_key: "test-linear-api-key",
        },
        inputData: {
          issueIdToUpdate: "issue-id",
          priority: "1",
        },
        inputDataRaw: {
          dueDate: "{{zap_clear_value}} ",
        },
      }
    );

    const requestOptions = requestMock.mock.calls[0][0];

    expect(requestOptions.body.variables).toEqual({
      issueIdToUpdate: "issue-id",
      priority: 1,
      dueDate: null,
    });
  });

  it("does not clear fields that are not in the clearable fields allowlist", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: {
        data: {
          issueUpdate: {
            success: true,
            issue: {
              id: "issue-id",
              identifier: "LIN-1",
              title: "Issue title",
              url: "https://linear.app/test/issue/LIN-1/issue-title",
            },
          },
        },
      },
    });

    await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: {
          api_key: "test-linear-api-key",
        },
        inputData: {
          issueIdToUpdate: "issue-id",
          title: "Issue title",
        },
        inputDataRaw: {
          title: "{{zap_clear_value}}",
        },
      }
    );

    const requestOptions = requestMock.mock.calls[0][0];

    expect(requestOptions.body.variables).toEqual({
      issueIdToUpdate: "issue-id",
      title: "Issue title",
    });
  });
});
