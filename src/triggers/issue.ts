import sample from "../samples/issue.json";
import { ZObject, Bundle } from "zapier-platform-core";

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
          dueDate: Date;
          createdAt: Date;
          updatedAt: Date;
          project? : {
            id: string;
            name: string;
          },
          creator?: {
            id: string;
            name: string;
            email: string;
          }
        }[];
      };
    };
  };
}

const buildIssueList = (orderBy: "createdAt" | "updatedAt") => async (z: ZObject, bundle: Bundle) => {
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
      query GetTeamIssues(
        $teamId: String!
        $priority: Float
        $statusId: ID
        $creatorId: ID
        $assigneeId: ID
        $labelId: ID
        $projectId: ID
        $orderBy: PaginationOrderBy!
      ) {
        team(id: $teamId) {
          issues(
            first: 25
            orderBy: $orderBy
            filter: {
              priority: { eq: $priority }
              state: { id: { eq: $statusId } }
              creator: { id: { eq: $creatorId } }
              assignee: { id: { eq: $assigneeId } }
              labels: { id: { eq: $labelId } }
              project: { id: { eq: $projectId } }
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
              createdAt
              updatedAt
              project {
                id
                name
              }
              creator {
                id
                name
                email
              }
            }
          }
        }
      }
      `,
      variables: {
        teamId: bundle.inputData.team_id,
        statusId: bundle.inputData.status_id,
        creatorId: bundle.inputData.creator_id,
        assigneeId: bundle.inputData.assignee_id,
        priority: bundle.inputData.priority && Number(bundle.inputData.priority) || undefined,
        labelId: bundle.inputData.label_id,
        projectId: bundle.inputData.project_id,

        orderBy,
      },
    },
    method: "POST",
  });

  const data = (response.json as TeamIssuesResponse).data;
  let issues = data.team.issues.nodes;

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
    ],
    sample,
  },
};

export const newIssue = {
  ...issue,
  key: "newIssue",
  display: {
    label: "New Issue",
    description: "Triggers when a new issues is created.",
  },
  operation: {
    ...issue.operation,
    perform: buildIssueList("createdAt"),
  },
};

export const updatedIssue = {
  ...issue,
  key: "updatedIssue",
  display: {
    label: "Updated Issue",
    description: "Triggers when an issue issue is updated.",
  },
  operation: {
    ...issue.operation,
    perform: buildIssueList("updatedAt"),
  },
};
