import { ZObject, Bundle } from "zapier-platform-core";

interface IssueResponse {
  data: {
    issue: {
        id: string;
        title: string;
        description: string;
        url: string;
        assignee: {
            id: string;
            email: string;
            name: string;
        };
    };
  };
}

const getIssue = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query Issue {
        issue(id: "${bundle.inputData.id}") {
            id
            title
            description
            url
            assignee {
                id
                email
                name
                url
                isMe
                displayName
                active
            }
            archivedAt
            canceledAt
            cycle {
                id
                name
                description
            }
            completedAt
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
            dueDate
            estimate
            number
            parent {
                id
                url
                title
            }
            priority
            priorityLabel
            startedAt
            startedTriageAt
            trashed
            triagedAt
            updatedAt
            team {
                id
                name
                organization {
                    id
                    name
                }
            }
        }
    }`,
    },
    method: "POST",
  });
  const data = (response.json as IssueResponse).data;
  const issue = data.issue;

  return [issue];
};

export const findIssueByID = {
  key: "issue",
  noun: "Issue",

  display: {
    label: "Find Issue by ID",
    hidden: false,
    description:
      "Find an Issue by ID.",
  },

  operation: {
    perform: getIssue,
    inputFields: [
        {
          key: "id",
          required: true,
          label: "ID of Issue",
        }
    ]
  },
};
