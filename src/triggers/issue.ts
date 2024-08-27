import { omitBy } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/issue.json";

interface TeamIssuesResponse {
  data: {
    team: {
      issues: {
        nodes: {
          id: string;
          identifier: string;
          url: string;
          title: string;
          description: string;
          priority: string;
          estimate: number;
          dueDate?: Date;
          slaBreachesAt?: Date;
          slaStartedAt?: Date;
          createdAt: Date;
          updatedAt: Date;
          project?: {
            id: string;
            name: string;
          };
          projectMilestone?: {
            id: string;
            name: string;
          };
          creator: {
            id: string;
            name: string;
            email: string;
          };
          assignee?: {
            id: string;
            name: string;
            email: string;
          };
          status: {
            id: string;
            name: string;
            type: string;
          };
          parent?: {
            id: string;
            identifier: string;
            url: string;
            title: string;
          };
        }[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  };
}

const buildIssueList = (orderBy: "createdAt" | "updatedAt") => async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.team_id) {
    throw new z.errors.HaltedError(`Please select the team first`);
  }

  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;

  const variables = omitBy(
    {
      after: cursor,
      teamId: bundle.inputData.team_id,
      statusId: bundle.inputData.status_id,
      creatorId: bundle.inputData.creator_id,
      assigneeId: bundle.inputData.assignee_id,
      priority: (bundle.inputData.priority && Number(bundle.inputData.priority)) || undefined,
      labelId: bundle.inputData.label_id,
      projectId: bundle.inputData.project_id,
      projectMilestoneId: bundle.inputData.project_milestone_id,
      orderBy,
    },
    (v) => v === undefined
  );

  const filters = [];
  if ("priority" in variables) {
    filters.push(`priority: { eq: $priority }`);
  }
  if ("statusId" in variables) {
    filters.push(`state: { id: { eq: $statusId } }`);
  }
  if ("creatorId" in variables) {
    filters.push(`creator: { id: { eq: $creatorId } }`);
  }
  if ("assigneeId" in variables) {
    filters.push(`assignee: { id: { eq: $assigneeId } }`);
  }
  if ("labelId" in variables) {
    filters.push(`labels: { id: { eq: $labelId } }`);
  }
  if ("projectId" in variables) {
    filters.push(`project: { id: { eq: $projectId } }`);
  }
  if ("projectMilestoneId" in variables) {
    filters.push(`projectMilestone: { id: { eq: $projectMilestoneId } }`);
  }

  const response = await z.request({
    url: "https://linear-dev-zapier.ngrok.io/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query ZapierListIssues(
        $after: String
        $teamId: String!
        ${"priority" in variables ? "$priority: Float" : ""}
        ${"statusId" in variables ? "$statusId: ID" : ""}
        ${"creatorId" in variables ? "$creatorId: ID" : ""}
        ${"assigneeId" in variables ? "$assigneeId: ID" : ""}
        ${"labelId" in variables ? "$labelId: ID" : ""}
        ${"projectId" in variables ? "$projectId: ID" : ""}
        ${"projectMilestoneId" in variables ? "$projectMilestoneId: ID" : ""}
        $orderBy: PaginationOrderBy!
      ) {
        team(id: $teamId) {
          issues(
            first: 10
            after: $after
            orderBy: $orderBy
            ${
              filters.length > 0
                ? `
            filter: {
              ${filters.join("\n              ")}
            }`
                : ""
            }
          ) {
            nodes {
              id
              identifier
              url
              title
              description
              priority
              estimate
              dueDate
              slaBreachesAt
              slaStartedAt
              createdAt
              updatedAt
              project {
                id
                name
              }
              projectMilestone {
                id
                name
              }
              creator {
                id
                name
                email
              }
              assignee {
                id
                name
                email
              }
              status: state {
                id
                name
                type
              }
              parent {
                id
                identifier
                url
                title
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
      `,
      variables,
    },
    method: "POST",
  });

  const data = (response.json as TeamIssuesResponse).data;
  const issues = data.team.issues.nodes;

  // Set cursor for pagination
  if (data.team.issues.pageInfo.hasNextPage) {
    await z.cursor.set(data.team.issues.pageInfo.endCursor);
  }

  return issues.map((issue) => ({
    ...issue,
    id: `${issue.id}-${issue[orderBy]}`,
    issueId: issue.id,
  }));
};

const issue = {
  noun: "Issue",

  operation: {
    inputFields: [
      {
        required: true,
        label: "Team",
        key: "team_id",
        helpText: "The team for the issue.",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Status",
        key: "status_id",
        helpText: "The issue status.",
        dynamic: "status.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Creator",
        key: "creator_id",
        helpText: "The user who created this issue.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Assignee",
        key: "assignee_id",
        helpText: "The assignee of this issue.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Priority",
        key: "priority",
        helpText: "The priority of the issue.",
        choices: [
          { value: "0", sample: "0", label: "No priority" },
          { value: "1", sample: "1", label: "Urgent" },
          { value: "2", sample: "2", label: "High" },
          { value: "3", sample: "3", label: "Medium" },
          { value: "4", sample: "4", label: "Low" },
        ],
      },
      {
        required: false,
        label: "Label",
        key: "label_id",
        helpText: "Label which was assigned to the issue.",
        dynamic: "label.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Project",
        key: "project_id",
        helpText: "Issue's project.",
        dynamic: "project.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Project Milestone",
        key: "project_milestone_id",
        helpText: "Issue's project milestone.",
        dynamic: "project_milestone.id.name",
        altersDynamicFields: true,
      },
    ],
    sample,
  },
};

export const newIssue = {
  ...issue,
  key: "newIssue",
  display: {
    label: "New Issue",
    description: "Triggers when a new issue is created.",
  },
  operation: {
    ...issue.operation,
    perform: buildIssueList("createdAt"),
    canPaginate: true,
  },
};

export const updatedIssue = {
  ...issue,
  key: "updatedIssue",
  display: {
    label: "Updated Issue",
    description: "Triggers when an issue is updated.",
  },
  operation: {
    ...issue.operation,
    perform: buildIssueList("updatedAt"),
    canPaginate: true,
  },
};
