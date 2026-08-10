const zapier = require("zapier-platform-core");
const App = require("../../../index");
const issuesByNameResponse = require("../fixtures/issuesByNameResponse.json");

const appTester = zapier.createAppTester(App);
const perform = App.searches.issues_by_name.operation.perform;

describe("searches.issue_by_name", () => {
  it("returns matching issues", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: issuesByNameResponse,
    });

    const results = await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: {
          api_key: "test-linear-api-key",
        },
        inputData: {
          name: "Setup SSO",
        },
      }
    );

    expect(results.map((issue) => issue.id)).toEqual(["issue-partial", "issue-exact-old", "issue-exact-new"]);
  });

  it("returns labels in GraphQL nodes shape", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: {
        data: {
          issues: {
            nodes: [
              {
                id: "issue-with-labels",
                title: "Setup SSO",
                labels: {
                  nodes: [
                    {
                      id: "label-1",
                      color: "#ff0000",
                      name: "bug",
                      parent: {
                        id: "parent-label-1",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    });

    const results = await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: {
          api_key: "test-linear-api-key",
        },
        inputData: {
          name: "Setup SSO",
        },
      }
    );

    expect(results[0].labels).toEqual({
      nodes: [
        {
          id: "label-1",
          color: "#ff0000",
          name: "bug",
          parent: {
            id: "parent-label-1",
          },
        },
      ],
    });
  });

  it("adds teamId to query variables when teamId is provided", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: issuesByNameResponse,
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
          name: "Setup SSO",
          teamId: "team_123",
        },
      }
    );

    const requestOptions = requestMock.mock.calls[0][0];
    const compactQuery = requestOptions.body.query.replace(/\s/g, "");

    expect(requestOptions.body.variables).toEqual({
      issueName: "Setup SSO",
      teamId: "team_123",
    });
    expect(compactQuery).toContain("containsIgnoreCase:$issueName");
    expect(compactQuery).toContain("team:{id:{eq:$teamId}}");
  });

  it("does not include teamId variable when teamId is not provided", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: issuesByNameResponse,
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
          name: "Setup SSO",
        },
      }
    );

    const requestOptions = requestMock.mock.calls[0][0];

    expect(requestOptions.body.variables).toEqual({
      issueName: "Setup SSO",
    });
  });
});
