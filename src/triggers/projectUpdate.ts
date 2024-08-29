import sample from "../samples/projectUpdate.json";
import { ZObject, Bundle } from "zapier-platform-core";

interface ProjectUpdatesResponse {
  data: {
    projectUpdates: {
      nodes: {
        id: string;
        body: string;
        diffMarkdown: string;
        createdAt: Date;
        updatedAt: Date;
        project?: {
          id: string;
          name: string;
        };
        user: {
          id: string;
          name: string;
          email: string;
        };
      }[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

const buildProjectUpdateList = (orderBy: "createdAt" | "updatedAt") => async (z: ZObject, bundle: Bundle) => {
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
      query ZapierListProjectUpdates(
        $after: String
        $teamId: ID
        $projectId: ID
        $userId: ID
        $orderBy: PaginationOrderBy!
      ) {
        projectUpdates(
          first: 10
          after: $after
          orderBy: $orderBy
          filter: {
            project: {
              id: { eq: $projectId }
              accessibleTeams: { id: { eq: $teamId } }
            }
            user: { id: { eq: $userId } }
          }
        ) {
          nodes {
            id
            body
            diffMarkdown
            health
            url
            editedAt
            createdAt
            updatedAt
            project {
              id
              name
            }
            user {
              id
              name
              email
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
      `,
      variables: {
        after: cursor,
        teamId: bundle.inputData.team_id,
        projectId: bundle.inputData.project_id,
        userId: bundle.inputData.user_id,
        orderBy,
      },
    },
    method: "POST",
  });

  const data = (response.json as ProjectUpdatesResponse).data;
  const projectUpdates = data.projectUpdates.nodes;

  // Set cursor for pagination
  if (data.projectUpdates.pageInfo.hasNextPage) {
    await z.cursor.set(data.projectUpdates.pageInfo.endCursor);
  }

  return projectUpdates.map((projectUpdate) => ({
    ...projectUpdate,
    id: `${projectUpdate.id}-${projectUpdate[orderBy]}`,
    projectUpdateId: projectUpdate.id,
  }));
};

const projectUpdate = {
  noun: "Project Update",

  operation: {
    inputFields: [
      {
        required: false,
        label: "Team",
        key: "team_id",
        helpText: "Limit to project updates from projects in this team.",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Project",
        key: "project_id",
        helpText: "Project this update belongs to.",
        dynamic: "project.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Creator",
        key: "user_id",
        helpText: "The user who created this project update.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
    ],
    sample,
  },
};

export const newProjectUpdate = {
  ...projectUpdate,
  key: "newProjectUpdate",
  display: {
    label: "New Project Update",
    description: "Triggers when a new project update is created.",
  },
  operation: {
    ...projectUpdate.operation,
    perform: buildProjectUpdateList("createdAt"),
    canPaginate: true,
  },
};

export const updatedProjectUpdate = {
  ...projectUpdate,
  key: "updatedProjectUpdate",
  display: {
    label: "Updated Project Update",
    description: "Triggers when a project update is updated.",
  },
  operation: {
    ...projectUpdate.operation,
    perform: buildProjectUpdateList("updatedAt"),
    canPaginate: true,
  },
};
