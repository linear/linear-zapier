import { ZObject, Bundle } from "zapier-platform-core";

interface ProjectMilestonesResponse {
  data: {
    project: {
      projectMilestones: {
        nodes: {
          id: string;
          name: string;
          sortOrder: number;
        }[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  };
}

const getProjectMilestonesList = async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.project_id) {
    return [];
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
      query ZapierListProjectMilestones($projectId: String!, $after: String) {
        project(id: $projectId) {
          projectMilestones(
            first: 100
            after: $after
            orderBy: createdAt
          ) {
            nodes {
              id
              name
              sortOrder
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`,
      variables: {
        projectId: bundle.inputData.project_id,
        after: cursor
      },
    },
    method: "POST",
  });

  const data = (response.json as ProjectMilestonesResponse).data;
  const projectMilestones = data.project.projectMilestones.nodes.sort((a, b) => a.sortOrder - b.sortOrder)

  // Set cursor for pagination
  if (data.project.projectMilestones.pageInfo.hasNextPage) {
    await z.cursor.set(data.project.projectMilestones.pageInfo.endCursor);
  }

  return projectMilestones;
};

export const projectMilestone = {
  key: "project_milestone",
  noun: "Project Milestone",

  display: {
    label: "Get project milestones",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of project milestones in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getProjectMilestonesList,
    canPaginate: true,
  },
};
