import { Bundle, ZObject } from "zapier-platform-core";

const createIssueRequest = async (z: ZObject, bundle: Bundle) => {
  const priority = bundle.inputData.priority ? parseInt(bundle.inputData.priority) : 0;

  const params = {
    teamId: bundle.inputData.team_id,
    title: bundle.inputData.title,
    description: bundle.inputData.description,
    priority: priority,
    stateId: bundle.inputData.status_id,
    assigneeId: bundle.inputData.assignee_id,
    projectId: bundle.inputData.project_id,
    labelIds: bundle.inputData.labels || [],
  };
  const input = JSON.stringify(params).replace(/"([^(")"]+)":/g, "$1:");

  const query = `
      mutation {
        issueCreate(input: ${input}) {
          issue {
            id 
            title
            url
          }
          success
        }
      }`;

  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query,
    },
    method: "POST",
  });

  const data = response.json as { data: { issueCreate: { issue: { url: string }; success: boolean } } };

  if (data.data.issueCreate.success) {
    return data;
  } else {
    throw new Error(`Failed to create an issue`);
  }
};

export const createIssue = {
  key: "create_issue",

  display: {
    hidden: false,
    important: true,
    description: "Create a new issue in Linear",
    label: "Create issue",
  },

  noun: "Issue",

  operation: {
    perform: createIssueRequest,

    inputFields: [
      {
        required: true,
        label: "Team",
        key: "team_id",
        helpText: "The team for which the issue will be created",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      {
        required: true,
        label: "Title",
        helpText: "The title of the issue",
        key: "title",
      },
      {
        label: "Description",
        helpText: "The description of the issue in markdown format",
        key: "description",
        type: "text",
      },
      {
        label: "Status",
        helpText: "The status of the issue",
        key: "status_id",
        dynamic: "status.id.name",
      },
      {
        label: "Assignee",
        helpText: "The assignee of the issue",
        key: "assignee_id",
        dynamic: "user.id.name",
      },
      {
        label: "Priority",
        helpText: "Select this issue's priority",
        key: "priority",
        choices: [
          { value: "0", sample: "0", label: "No priority" },
          { value: "1", sample: "1", label: "Urgent" },
          { value: "2", sample: "2", label: "High" },
          { value: "3", sample: "3", label: "Medium" },
          { value: "4", sample: "4", label: "Low" },
        ],
      },
      {
        label: "Labels",
        helpText: "Tag the issue with labels",
        key: "labels",
        dynamic: "label.id.name",
        list: true,
      },
      {
        label: "Project",
        helpText: "The issue project",
        key: "project_id",
        dynamic: "project.id.name",
      },
    ],
    sample: { data: { issueCreate: { success: true } } },
  },
};
