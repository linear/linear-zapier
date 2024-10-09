import { ZObject, Bundle } from "zapier-platform-core";

interface TeamResponse {
  data: {
    teams: {
      nodes: {
        id: string;
        name: string;
        archivedAt: Date | null;
      }[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

const getTeamList = async (z: ZObject, bundle: Bundle) => {
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;

  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query ZapierListTeams($after: String) { 
        teams(first: 50, after: $after) { 
          nodes {
            id
            name
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      variables: {
        after: cursor,
      },
    },
    method: "POST",
  });
  const data = (response.json as TeamResponse).data;
  const teams = data.teams.nodes;

  // Set cursor for pagination
  if (data.teams.pageInfo.hasNextPage) {
    await z.cursor.set(data.teams.pageInfo.endCursor);
  }

  return teams;
};

export const team = {
  key: "team",
  noun: "Team",

  display: {
    label: "Get team",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of repos in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getTeamList,
    canPaginate: true,
  },
};
