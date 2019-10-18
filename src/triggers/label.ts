import { ZObject, Bundle } from "zapier-platform-core";

interface LabelsResponse {
  data: {
    issueLabels: {
      id: string;
      name: string;
      type: string;
      archivedAt: Date | null;
      team: {
        id: string;
      };
    }[];
  };
}

const getLabelList = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query {
        issueLabels {
          id
          name
          archivedAt
          team {
            id
          }
        }
      }`,
    },
    method: "POST",
  });

  return (response.json as LabelsResponse).data.issueLabels
    .filter(status => status.archivedAt === null && status.team.id === bundle.inputData.team_id)
    .map(status => ({
      id: status.id,
      name: status.name,
    }));
};

export const label = {
  key: "label",
  noun: "Label",

  display: {
    label: "Get issue label",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of issue labels in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getLabelList,
  },
};
