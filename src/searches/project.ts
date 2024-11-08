import { ZObject, Bundle } from "zapier-platform-core";

interface ProjectResponse {
  data: {
    project: {
        id: string;
        name: string;
        url: string;
        creator: {
            id: string;
            email: string;
            name: string;
        };
    };
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
        project(id: ${bundle.inputData.id}) {
            id
            name
            url
            archivedAt
            canceledAt
            autoArchivedAt
            completedAt
            completedIssueCountHistory
            content
            createdAt
            creator {
                id
                email
                name
                url
                isMe
                displayName
                active
            }
            currentProgress
            description
            health
            healthUpdatedAt
            lead {
                id
                email
                name
                url
                isMe
                displayName
                active
            }
            priority
            prioritySortOrder
            projectUpdateRemindersPausedUntilAt
            slugId
            startDate
            startedAt
            startDateResolution
            status {
                name
            }
            targetDate
            trashed
            updatedAt
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
    description:
      "Find a Project by ID.",
  },

  operation: {
    perform: getProject,
    inputFields: [
        {
          key: "id",
          required: true,
          label: "Project ID or Slug ID",
        }
    ]
  },
};
