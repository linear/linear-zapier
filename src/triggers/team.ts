import { ZObject, Bundle } from "zapier-platform-core";

interface TeamResponse {
  data: {
    teams: {
      id: string;
      name: string;
      archivedAt: Date | null;
    }[];
  };
}

const getTeamList = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: { query: "query { teams { id name archivedAt }}" },
    method: "POST",
  });
  return (response.json as TeamResponse).data.teams.filter(team => team.archivedAt === null);
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
  },
};
