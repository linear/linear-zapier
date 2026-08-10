const zapier = require("zapier-platform-core");
const App = require("../../../index");
const issueCommentsResponse = require("../fixtures/issueCommentsResponse.json");

const appTester = zapier.createAppTester(App);
const perform = App.searches.issue_comments.operation.perform;

describe("searches.issue_comments", () => {
  it("returns top-level comments newest first, with replies nested under children", async () => {
    const requestMock = jest.fn().mockResolvedValue({ json: issueCommentsResponse });

    const results = await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: { api_key: "test-linear-api-key" },
        inputData: { issueId: "SAM-15" },
      }
    );

    expect(results.map((c) => c.id)).toEqual(["comment-newer", "comment-older"]);
    expect(results[0].children.nodes.map((c) => c.id)).toEqual(["reply-1", "reply-2"]);
  });

  it("attaches the parent issue summary to each comment", async () => {
    const requestMock = jest.fn().mockResolvedValue({ json: issueCommentsResponse });

    const results = await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: { api_key: "test-linear-api-key" },
        inputData: { issueId: "SAM-15" },
      }
    );

    expect(results[0].issue).toEqual({
      id: "issue-uuid",
      identifier: "SAM-15",
      title: "Sample issue",
      url: "https://linear.app/example/issue/SAM-15",
      team: { id: "team-uuid", key: "SAM", name: "Sample" },
    });
  });

  it("returns an empty array when the issue field comes back null", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: { data: { issue: null } },
    });

    const results = await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: { api_key: "test-linear-api-key" },
        inputData: { issueId: "MISSING-1" },
      }
    );

    expect(results).toEqual([]);
  });

  it("returns an empty array when Linear reports a user input error (e.g. invalid issue key)", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: {
        data: null,
        errors: [
          {
            message: "Entity not found: Issue",
            path: ["issue"],
            extensions: {
              type: "invalid input",
              code: "INPUT_ERROR",
              statusCode: 400,
              userError: true,
              userPresentableMessage: "Could not find referenced Issue.",
            },
          },
        ],
      },
    });

    const results = await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: { api_key: "test-linear-api-key" },
        inputData: { issueId: "BOGUS-999" },
      }
    );

    expect(results).toEqual([]);
  });

  it("throws the user-presentable message for non-user GraphQL errors", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: {
        data: null,
        errors: [
          {
            message: "Internal server error",
            extensions: {
              type: "internal",
              code: "INTERNAL_ERROR",
              userError: false,
              userPresentableMessage: "Something went wrong on our end.",
            },
          },
        ],
      },
    });

    await expect(
      appTester(
        (z, bundle) => {
          z.request = requestMock;
          return perform(z, bundle);
        },
        {
          authData: { api_key: "test-linear-api-key" },
          inputData: { issueId: "SAM-15" },
        }
      )
    ).rejects.toThrow("Something went wrong on our end.");
  });

  it("sends issueId as a GraphQL variable and filters to top-level comments", async () => {
    const requestMock = jest.fn().mockResolvedValue({ json: issueCommentsResponse });

    await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return perform(z, bundle);
      },
      {
        authData: { api_key: "test-linear-api-key" },
        inputData: { issueId: "SAM-15" },
      }
    );

    const requestOptions = requestMock.mock.calls[0][0];
    const compactQuery = requestOptions.body.query.replace(/\s/g, "");

    expect(requestOptions.body.variables).toEqual({ issueId: "SAM-15" });
    expect(compactQuery).toContain("issue(id:$issueId)");
    expect(compactQuery).toContain("filter:{parent:{null:true}}");
    expect(compactQuery).toContain("orderBy:createdAt");
  });
});
