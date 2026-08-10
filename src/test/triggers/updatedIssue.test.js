const zapier = require("zapier-platform-core");
const App = require("../../../index");

const appTester = zapier.createAppTester(App);
const perform = App.triggers.updatedIssueInstant.operation.perform;

describe("triggers.updatedIssueInstant (getWebhookDataForIssue)", () => {
  it("sets `addedLabels` to [] when `updatedFrom` has no `labelIds` (labels did not change)", async () => {
    const results = await appTester((z, bundle) => perform(z, bundle), {
      authData: { api_key: "test-key" },
      cleanedRequest: {
        data: {
          id: "issue-1",
          labelIds: ["label-1", "label-2"],
          labels: [
            { id: "label-1", color: "#ccc", name: "A" },
            { id: "label-2", color: "#ddd", name: "B" },
          ],
        },
        updatedFrom: { subscriberIds: ["user-1"] },
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0].addedLabels).toEqual([]);
  });

  it("sets `addedLabels` to only newly added labels when `updatedFrom.labelIds` is present", async () => {
    const results = await appTester((z, bundle) => perform(z, bundle), {
      authData: { api_key: "test-key" },
      cleanedRequest: {
        data: {
          id: "issue-1",
          labelIds: ["label-1", "label-2"],
          labels: [
            { id: "label-1", color: "#ccc", name: "A" },
            { id: "label-2", color: "#ddd", name: "B" },
          ],
        },
        updatedFrom: { labelIds: ["label-1"] },
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0].addedLabels).toEqual([{ id: "label-2", color: "#ddd", name: "B" }]);
  });

  it("sets `addedLabels` to [] when `updatedFrom.labelIds` is present but no new labels", async () => {
    const results = await appTester((z, bundle) => perform(z, bundle), {
      authData: { api_key: "test-key" },
      cleanedRequest: {
        data: {
          id: "issue-1",
          labelIds: ["label-1", "label-2"],
          labels: [
            { id: "label-1", color: "#ccc", name: "A" },
            { id: "label-2", color: "#ddd", name: "B" },
          ],
        },
        updatedFrom: { labelIds: ["label-1", "label-2"] },
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0].addedLabels).toEqual([]);
  });

  it("sets `addedLabels` to [] when `updatedFrom` is missing", async () => {
    const results = await appTester((z, bundle) => perform(z, bundle), {
      authData: { api_key: "test-key" },
      cleanedRequest: {
        data: {
          id: "issue-1",
          labelIds: ["label-1"],
          labels: [{ id: "label-1", color: "#ccc", name: "A" }],
        },
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0].addedLabels).toEqual([]);
  });
});
