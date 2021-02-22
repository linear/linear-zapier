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
          state: {
            id: string;
            name: string;
            type: string;
          };
          labels: {
            nodes: {
              id: string;
              name: string;
            }[];
          };
          project?: {
            id: string;
            name: string;
          };
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
      query {
        team(id: "${bundle.inputData.team_id}"){
           issues(first: 50, orderBy: ${orderBy}) {
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
              state {
                id
                name
                type
              }
              labels {
                nodes {
                  id
                  name
                }
              }
              project {
                id
                name
              }              
            }
          } 
        }
      }`,
    },
    method: "POST",
  });

  const data = (response.json as TeamIssuesResponse).data;
  let issues = data.team.issues.nodes;

  // Filter by fields if set
  if (bundle.inputData.status_id) {
    issues = issues.filter((issue) => issue.state.id === bundle.inputData.status_id);
  }
  if (bundle.inputData.creator_id) {
    issues = issues.filter((issue) => issue.creator.id === bundle.inputData.creator_id);
  }
  if (bundle.inputData.assignee_id) {
    issues = issues.filter((issue) => issue.assignee && issue.assignee.id === bundle.inputData.assignee_id);
  }
  if (bundle.inputData.label_id) {
    issues = issues.filter(
      (issue) => issue.labels.nodes.find((label) => label.id === bundle.inputData.label_id) !== undefined
    );
  }
  if (bundle.inputData.project_id) {
    issues = issues.filter((issue) => issue.project && issue.project.id === bundle.inputData.project_id);
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
