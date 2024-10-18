import { Bundle, ZObject } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";

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
  const priority = bundle.inputData.priority ? parseInt(bundle.inputData.priority) : undefined;
  const estimate = bundle.inputData.estimate ? parseInt(bundle.inputData.estimate) : undefined;

  const subscriberIds: string[] = [];
  if (bundle.inputData.subscriber_emails) {
    z.console.log(`Getting subscribers by emails: ${bundle.inputData.subscriber_emails.length}`);
    const usersQuery = `
      query ZapierUsersByEmails($filter: UserFilter, $first: Int) {
        users(filter: $filter, first: $first) {
          nodes {
            id
          }
        }
      }
    `;
    const usersVariables = {
      filter: {
        email: { in: bundle.inputData.subscriber_emails },
      },
      first: 100,
    };
    // Transform subscriber emails to user ids
    const usersResponse = await z.request({
      url: "https://api.linear.app/graphql",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: bundle.authData.api_key,
      },
      body: {
        query: usersQuery,
        variables: usersVariables,
      },
      method: "POST",
    });
    const users = usersResponse.json as {
      data?: {
        users: {
          nodes: { id: string }[];
        };
      };
      errors?: {
        message: string;
        extensions?: {
          userPresentableMessage?: string;
        };
      }[];
    };

    if (users.errors && users.errors.length) {
      const error = users.errors[0];
      z.console.error(`Failed to get subscribers: ${JSON.stringify(error)}`);
      throw new z.errors.Error(
        (error.extensions && error.extensions.userPresentableMessage) || error.message,
        "invalid_input",
        400
      );
    }

    z.console.log(`Got ${users.data?.users.nodes.length} subscribers`);
    subscriberIds.push(...(users.data?.users.nodes.map((user) => user.id) || []));
  }

  const variables = {
    teamId: bundle.inputData.team_id,
    templateId: bundle.inputData.templateId,
    title: bundle.inputData.title,
    description: bundle.inputData.description,
    priority: priority,
    estimate: estimate,
    stateId: bundle.inputData.status_id,
    parentId: bundle.inputData.parent_id,
    assigneeId: bundle.inputData.assignee_id,
    projectId: bundle.inputData.project_id,
    projectMilestoneId: bundle.inputData.project_milestone_id,
    dueDate: bundle.inputData.due_date,
    labelIds: bundle.inputData.labels || undefined,
    subscriberIds: subscriberIds.length > 0 ? subscriberIds : undefined,
  };

  const query = `
      mutation ZapierIssueCreate(
        $teamId: String!,
        $templateId: String,
        $title: String!,
        $description: String,
        $priority: Int,
        $estimate: Int,
        $stateId: String,
        $parentId: String,
        $assigneeId: String,
        $projectId: String,
        $projectMilestoneId: String,
        $dueDate: TimelessDate,
        $labelIds: [String!],
        $subscriberIds: [String!],
      ) {
        issueCreate(input: {
          teamId: $teamId,
          templateId: $templateId,
          title: $title,
          description: $description,
          priority: $priority,
          estimate: $estimate,
          stateId: $stateId,
          parentId: $parentId,
          assigneeId: $assigneeId,
          projectId: $projectId,
          projectMilestoneId: $projectMilestoneId,
          dueDate: $dueDate,
          labelIds: $labelIds
          subscriberIds: $subscriberIds
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
    description: "Create a new issue in Linear",
    label: "Create Issue",
  },

  noun: "Issue",

  operation: {
    perform: createIssueRequest,

    inputFields: [
      {
        label: "Template",
        helpText:
          "The template to use for the issue. If no team has been selected yet, only workspace templates will be available. If other inputs are provided, they will override the template values.",
        key: "templateId",
        dynamic: "issueTemplates.id.name",
        altersDynamicFields: true,
      },
      // Even if a template is chosen, we can't set a dynamic field programmatically based on another input: https://github.com/zapier/zapier-platform-cli#customdynamic-fields
      {
        required: true,
        label: "Team",
        key: "team_id",
        helpText: "The team for which the issue will be created",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      // Populate title with the template's title if applicable
      async function (z: ZObject, bundle: Bundle) {
        const baseTitle = {
          label: "Title",
          helpText: "The title of the issue",
          key: "title",
          required: true,
        };
        if (bundle.inputData.templateId) {
          const query = `
            query ZapierTemplate($templateId: String!) {
              template(id: $templateId) {
                templateData
              }
            }`;
          const response = await fetchFromLinear(z, bundle, query, { templateId: bundle.inputData.templateId });

          const template = response.json.data.template;
          const templateData = JSON.parse(template.templateData);
          if (templateData.title) {
            return { ...baseTitle, required: false };
          }
        }
        return baseTitle;
      },
      {
        label: "Description",
        helpText: "The description of the issue in markdown format",
        key: "description",
        type: "text",
      },
      {
        label: "Parent Issue",
        helpText: "The id of the parent issue",
        type: "string",
        key: "parent_id",
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
        label: "Subscriber emails",
        helpText: "Email addresses of users to subscribe to this issue. If the user is not found, it will be ignored.",
        key: "subscriber_emails",
        type: "string",
        list: true,
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
        label: "Estimate",
        helpText: "Select this issue's estimate",
        key: "estimate",
        dynamic: "estimate.id.label",
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
      {
        label: "Project Milestone",
        helpText: "The issue project milestone",
        key: "project_milestone_id",
        dynamic: "project_milestone.id.name",
      },
      {
        label: "Due Date",
        helpText: "The issue due date in `yyyy-MM-dd` format",
        key: "due_date",
        type: "string",
      },
    ],
    sample: {
      data: {
        id: "7b647c45-c528-464d-8634-eecea0f73033",
        title: "Do the roar",
        url: "https://linear.app/team-best-team/issue/ENG-118/do-the-roar",
        identifier: "ENG-118",
      },
    },
  },
};
