import { Bundle, ZObject } from "zapier-platform-core";

interface CreateIssueRequestResponse {
  data?: {
    issueCreate: {
      issue: {
        id: string;
        title: string;
        url: string;
        identifier: string;
      };
      success: boolean;
    };
  };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
}

const createIssueRequest = async (z: ZObject, bundle: Bundle) => {
  const priority = bundle.inputData.priority ? parseInt(bundle.inputData.priority) : 0;

  const variables = {
    teamId: bundle.inputData.team_id,
    title: bundle.inputData.title,
    description: bundle.inputData.description,
    priority: priority,
    stateId: bundle.inputData.status_id,
    assigneeId: bundle.inputData.assignee_id,
    projectId: bundle.inputData.project_id,
    labelIds: bundle.inputData.labels || [],
  };

  const query = `
      mutation IssueCreate(
        $teamId: String!,
        $title: String!,
        $description: String,
        $priority: Int,
        $stateId: String,
        $assigneeId: String,
        $projectId: String,
        $labelIds: [String!],
      ) {
        issueCreate(input: {
          teamId: $teamId,
          title: $title,
          description: $description,
          priority: $priority,
          stateId: $stateId,
          assigneeId: $assigneeId,
          projectId: $projectId,
          labelIds: $labelIds
        }) {
          issue {
            id 
            identifier
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
      variables,
    },
    method: "POST",
  });

  const data = response.json as CreateIssueRequestResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.issueCreate && data.data.issueCreate.success) {
    return data.data.issueCreate.issue;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong";
    throw new z.errors.Error(`Failed to create an issue`, error, 400);
  }
};

export const createIssue = {
  key: "create_issue",

  display: {
    hidden: false,
    important: true,
    description: "Create a new issue in Linear",
    label: "Create Issue",
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
    sample: {
      data: {
        issueCreate: {
          id: "4",
          title: "Do the roar",
          url: "https://linear.app/team-best-team/issue/ENG-118/do-the-roar",
          identifier: "ENG-118",
        }
      }
    },
  },
};
