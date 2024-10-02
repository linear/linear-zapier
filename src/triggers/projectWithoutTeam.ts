import { ZObject, Bundle } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";

interface ProjectsResponse {
  data: {
    projects: {
      nodes: {
        id: string;
        name: string;
      }[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

const getProjectList = async (z: ZObject, bundle: Bundle) => {
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;
  const query = `
      query ZapierListProjects($after: String) {
        projects(
          first: 100
          after: $after
          orderBy: updatedAt
        ) {
          nodes {
            id
            name
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`;
  const response = await fetchFromLinear(z, bundle, query, cursor ? { after: cursor } : {});
  const data = (response.json as ProjectsResponse).data;
  const projects = data.projects.nodes;

  // Set cursor for pagination
  if (data.projects.pageInfo.hasNextPage) {
    await z.cursor.set(data.projects.pageInfo.endCursor);
  }

  return projects;
};

export const projectWithoutTeam = {
  key: "projectWithoutTeam",
  noun: "Project",
  display: {
    label: "Get project",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of projects in the UI, thus, it's hidden.",
  },
  operation: {
    perform: getProjectList,
    canPaginate: true,
  },
};
