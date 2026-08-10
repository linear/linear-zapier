import { ZObject, Bundle } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";
import sample from "../samples/issueCommentWithReplies.json";

interface IssueCommentsInput {
  issueId: string;
}

interface IssueSummary {
  id: string;
  identifier: string;
  title: string;
  url: string;
  team: { id: string; key: string; name: string };
}

interface CommentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface ChildComment {
  id: string;
  body: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser | null;
}

interface CommentApi extends ChildComment {
  children: { nodes: ChildComment[] };
}

interface LinearGraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: {
    type?: string;
    code?: string;
    userError?: boolean;
    userPresentableMessage?: string;
  };
}

interface IssueCommentsResponse {
  data: {
    issue:
      | (IssueSummary & {
          comments: { nodes: CommentApi[] };
        })
      | null;
  } | null;
  errors?: LinearGraphQLError[];
}

const findIssueCommentsPerform = async (z: ZObject, bundle: Bundle<IssueCommentsInput>) => {
  const variables = { issueId: bundle.inputData.issueId };
  const query = `
    query ZapierIssueComments($issueId: String!) {
      issue(id: $issueId) {
        id
        identifier
        title
        url
        team {
          id
          key
          name
        }
        comments(first: 50, orderBy: createdAt, filter: { parent: { null: true } }) {
          nodes {
            id
            body
            url
            createdAt
            updatedAt
            user {
              id
              name
              email
              avatarUrl
            }
            children(first: 50, orderBy: createdAt) {
              nodes {
                id
                body
                url
                createdAt
                updatedAt
                user {
                  id
                  name
                  email
                  avatarUrl
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetchFromLinear(z, bundle, query, variables);
  const body = response.json as IssueCommentsResponse;

  // Linear returns HTTP 200 with { errors: [...], data: null } for input
  // errors like "Entity not found". The shared afterResponse middleware
  // only intercepts authentication errors, so handle the rest here.
  const firstError = body.errors?.[0];
  if (firstError) {
    if (firstError.extensions?.userError) {
      return [];
    }
    throw new z.errors.Error(
      firstError.extensions?.userPresentableMessage ?? firstError.message,
      "request_execution_failed",
      400
    );
  }

  const issue = body.data?.issue;
  if (!issue) {
    return [];
  }

  const { comments, ...issueSummary } = issue;

  return comments.nodes.map((comment) => ({ ...comment, issue: issueSummary }));
};

export const findIssueComments = {
  key: "issue_comments",
  noun: "Comment",

  display: {
    label: "Find Comments on Issue",
    hidden: false,
    description: "Find comments on a Linear issue by ID or identifier (e.g. SAM-15).",
  },

  operation: {
    perform: findIssueCommentsPerform,
    inputFields: [
      {
        key: "issueId",
        required: true,
        label: "Issue ID or identifier",
        helpText: "The Linear issue UUID or its short identifier (e.g. SAM-15).",
      },
    ],
    sample,
  },
};
