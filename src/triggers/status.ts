import { ZObject, Bundle } from "zapier-platform-core";

interface TeamStatesResponse {
  data: {
    team: {
      states: {
        nodes: {
          id: string;
          name: string;
          type: string;
        }[];
      };
    };
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
        team(id: "${bundle.inputData.team_id}"){
           states(first: 100) {
            nodes {
              id
              name
              type
            }
          } 
        }
      }`,
    },
    method: "POST",
  });

  const data = (response.json as TeamStatesResponse).data;
  return data.team.states.nodes.filter((status) => ["backlog", "unstarted", "started"].indexOf(status.type) >= 0);
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
