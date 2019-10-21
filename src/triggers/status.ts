import { ZObject, Bundle } from "zapier-platform-core";

interface WorkflowStatesResponse {
  data: {
    workflowStates: {
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

const getStatusList = async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.team_id) {
    throw new Error(`Please select the team first`);
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
        workflowStates {
          id
          name
          type
          archivedAt
          team {
            id
          }
        }
      }`,
    },
    method: "POST",
  });

  const data = (response.json as WorkflowStatesResponse).data;
  return data.workflowStates.filter(
    status =>
      status.archivedAt === null &&
      status.team.id === bundle.inputData.team_id &&
      ["backlog", "unstarted", "started"].indexOf(status.type) >= 0
  );
};

export const status = {
  key: "status",
  noun: "Status",

  display: {
    label: "Get issue status",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of issue statuses in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getStatusList,
  },
};
