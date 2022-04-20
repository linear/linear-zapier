import { ZObject, Bundle } from "zapier-platform-core";

interface TeamResponse {
  data: {
    teams: {
      nodes: {
        id: string;
        name: string;
        archivedAt: Date | null;
      }[];
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
      query GetTeams($after: String) { 
        teams(first: 50, after: $after) { 
          nodes {
            id
            name
          }
        }
      }`,
      variables: {
        after: cursor
      },
    },
    method: "POST",
  });
  const teams = (response.json as TeamResponse).data.teams.nodes

  const nextCursor = teams?.[teams.length - 1]?.id
  if (nextCursor) {
    await z.cursor.set(nextCursor);
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
