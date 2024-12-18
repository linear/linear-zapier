import { ZObject, Bundle } from "zapier-platform-core";
import { IssueCommon } from "../triggers/issueV2";

interface IssueResponse {
  data: {
    issue: IssueCommon;
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
          state {
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
          labels {
            nodes {
              id
              color
              name
              parent {
                id
              }
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
    label: "Find issue by ID",
    hidden: false,
    description: "Find an issue by ID or identifier",
  },

  operation: {
    perform: getIssue,
    inputFields: [
      {
        key: "id",
        required: true,
        label: "Issue ID or identifier",
      },
    ],
  },
};
