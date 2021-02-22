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
          projects(first:100) {
            nodes {
              id
              name
              state
            }
          }
        }
      }`,
    },
    method: "POST",
  });

  const data = (response.json as TeamProjectsResponse).data;
  return data.team.projects.nodes.filter((project) => ["started", "planned", "paused"].indexOf(project.state) >= 0);
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
  },
};
