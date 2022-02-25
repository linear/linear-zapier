import { ZObject, Bundle } from "zapier-platform-core";

interface TeamProjectsResponse {
  data: {
    team: {
      projects: {
        nodes: {
          id: string;
          name: string;
          state: string;
        }[];
      };
    };
  };
}

const getProjectList = async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.team_id) {
    throw new z.errors.HaltedError(`Please select the team first`);
  }
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
      query ($teamId: String!, $after: String) {
        team(id: $teamId) {
          projects(
            first: 100
            after: $after
            orderBy: updatedAt
            filter: { state: { in: ["started", "planned", "paused"] } }
          ) {
            nodes {
              id
              name
              state
            }
          }
        }
      }`,
      variables: {
        teamId: bundle.inputData.team_id,
        after: cursor
      },
    },
    method: "POST",
  });

  const data = (response.json as TeamProjectsResponse).data;
  const projects = data.team.projects.nodes

  await z.cursor.set(projects[projects.length - 1]?.id);

  return projects;
};

export const project = {
  key: "project",
  noun: "Project",

  display: {
    label: "Get issue project",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of issue projects in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getProjectList,
    canPaginate: true,
  },
};
