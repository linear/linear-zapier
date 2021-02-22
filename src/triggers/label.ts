import { ZObject, Bundle } from "zapier-platform-core";

interface LabelsResponse {
  data: {
    team: {
      labels: {
        nodes: {
          id: string;
          name: string;
        }[];
      };
    };
  };
}

const getLabelList = async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.team_id) {
    throw new z.errors.HaltedError(`Please select the team first`);
  }

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
        team(id: "${bundle.inputData.team_id}"){
          labels(first:100) {
            nodes {
              id
              name
            }
          }
        }
      }`,
    },
    method: "POST",
  });

  const data = (response.json as LabelsResponse).data;

  return data.team.labels.nodes;
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
