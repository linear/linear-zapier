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
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  };
}

const getStatusList = async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.team_id) {
    throw new z.errors.HaltedError(`Please select the team first`);
  }
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;

  const response = await z.request({
    url: "https://linear-dev-intercom.ngrok.io/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query ZapierListStatuses($teamId: String!, $after: String) {
        team(id: $teamId){
          states(first: 50, after: $after) {
            nodes {
              id
              name
              type
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          } 
        }
      }`,
      variables: {
        teamId: bundle.inputData.team_id,
        after: cursor,
      },
    },
    method: "POST",
  });

  const data = (response.json as TeamStatesResponse).data;
  const statuses = data.team.states.nodes;

  // Set cursor for pagination
  if (data.team.states.pageInfo.hasNextPage) {
    await z.cursor.set(data.team.states.pageInfo.endCursor);
  }

  return statuses;
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
    canPaginate: true,
  },
};
