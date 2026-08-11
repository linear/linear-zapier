const zapier = require("zapier-platform-core");
const App = require("../../../index");

const appTester = zapier.createAppTester(App);
const newIssueInstant = App.triggers.newIssueInstant;
const newIssueLegacy = App.triggers.newIssue;

describe("triggers.newIssueInstant", () => {
  it("uses a team sample without changing the legacy sample", () => {
    expect(newIssueInstant.operation.sample).toEqual(
      expect.objectContaining({
        teamId: "2b03b41f-4b55-4779-bd22-4786eb76e11f",
        team: {
          id: "2b03b41f-4b55-4779-bd22-4786eb76e11f",
          key: "SAMPLE",
          name: "Sample Team",
        },
      })
    );
    expect(newIssueInstant.operation.sample.attachments).toEqual(newIssueLegacy.operation.sample.attachments);
    expect(newIssueLegacy.operation.sample).not.toHaveProperty("teamId");
    expect(newIssueLegacy.operation.sample).not.toHaveProperty("team");
  });

  it("includes the team in polling test data", async () => {
    const requestMock = jest.fn().mockResolvedValue({
      json: {
        data: {
          team: {
            id: "team-id",
            key: "ENG",
            name: "Engineering",
            issues: {
              nodes: [
                {
                  id: "issue-id",
                  identifier: "ENG-123",
                  url: "https://linear.app/example/issue/ENG-123",
                  title: "Test issue",
                  description: "Test description",
                  priority: 0,
                  createdAt: "2026-07-31T00:00:00.000Z",
                  updatedAt: "2026-07-31T00:00:00.000Z",
                  creator: {
                    id: "creator-id",
                    name: "Creator",
                    email: "creator@example.com",
                  },
                  state: {
                    id: "state-id",
                    name: "Backlog",
                    type: "backlog",
                  },
                  labels: { nodes: [] },
                },
              ],
            },
          },
        },
      },
    });

    const [issue] = await appTester(
      (z, bundle) => {
        z.request = requestMock;
        return newIssueInstant.operation.performList(z, bundle);
      },
      {
        authData: { api_key: "test-linear-api-key" },
        inputData: { teamId: "team-id" },
      }
    );

    const compactQuery = requestMock.mock.calls[0][0].body.query.replace(/\s/g, "");
    expect(compactQuery).toContain("team(id:$teamId){idkeynameissues");
    expect(issue).toEqual(
      expect.objectContaining({
        teamId: "team-id",
        team: {
          id: "team-id",
          key: "ENG",
          name: "Engineering",
        },
      })
    );
  });
});
