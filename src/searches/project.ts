import { ZObject, Bundle } from "zapier-platform-core";
import { ProjectApi } from "../triggers/newProject";
import sample from "../samples/project.json";

interface ProjectResponse {
  data: {
    project: ProjectApi;
  };
}

const getProject = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query Project {
        project(id: "${bundle.inputData.id}") {
          id
          url
          name
          description
          priority
          createdAt
          updatedAt
          startDate
          targetDate
          status {
            id
            name
            type
          }
          teams {
            nodes {
              id
              name
            }
          }
          initiatives {
            nodes {
              id
              name
            }
          }
          projectMilestones {
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
  const data = (response.json as ProjectResponse).data;
  const project = data.project;

  return [project];
};

export const findProjectByID = {
  key: "project",
  noun: "Project",

  display: {
    label: "Find Project by ID",
    hidden: false,
    description: "Find a project by ID or slug ID",
  },

  operation: {
    perform: getProject,
    inputFields: [
      {
        key: "id",
        required: true,
        label: "Project ID or project slug ID",
      },
    ],
    sample,
  },
};
