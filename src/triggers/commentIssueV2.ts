import { omitBy, pick } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/issueComment.json";
import { getWebhookData, unsubscribeHook } from "../handleWebhook";

interface Comment {
  id: string;
  body: string;
  url: string;
  createdAt: string;
  resolvedAt: string | null;
  issue: {
    id: string;
    identifier: string;
    title: string;
    url: string;
    team: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
  parent: {
    id: string;
    body: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string;
    };
  } | null;
}

interface CommentsResponse {
  data: {
    comments: {
      nodes: Comment[];
    };
  };
}

const subscribeHook = (z: ZObject, bundle: Bundle) => {
  const data = {
    url: bundle.targetUrl,
    inputData:
      bundle.inputData && Object.keys(bundle.inputData).length > 0
        ? pick(bundle.inputData, ["creatorId", "teamId", "issueId"])
        : undefined,
  };

  return z
    .request({
      url: "https://client-api.linear.app/connect/zapier/subscribe/commentIssue",
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

const getCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const variables = omitBy(
    {
      creatorId: bundle.inputData.creatorId,
      teamId: bundle.inputData.teamId,
      issueId: bundle.inputData.issueId,
    },
    (v) => v === undefined
  );

  const filters = [`{ issue: { null: false } }`];
  if ("creatorId" in variables) {
    filters.push(`{ user: { id: { eq: $creatorId } } }`);
  }
  if ("teamId" in variables) {
    filters.push(`{ issue: { team: { id: { eq: $teamId } } } }`);
  }
  if ("issueId" in variables) {
    filters.push(`{ issue: { id: { eq: $issueId } } }`);
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
      query ZapierListCommentsV2${
        Object.keys(variables).length === 0
          ? ""
          : `(
        ${"creatorId" in variables ? "$creatorId: ID" : ""}
        ${"teamId" in variables ? "$teamId: ID" : ""}
        ${"issueId" in variables ? "$issueId: ID" : ""}
      )`
      } {
        comments(
          first: 25
          ${
            filters.length > 0
              ? `
          filter: {
            and : [
              ${filters.join("\n              ")}
            ]
          }`
              : ""
          }
        ) {
          nodes {
            id
            body
            createdAt
            resolvedAt
            issue {
              id
              identifier
              title
              url
              team {
                id
                name
              }
            }
            user {
              id
              email
              name
              avatarUrl
            }
            parent {
              id
              body
              createdAt
              user {
                id
                email
                name
                avatarUrl
              }
            }
          }
        }
      }`,
      variables: variables,
    },
    method: "POST",
  });

  const data = (response.json as CommentsResponse).data;
  return data.comments.nodes;
};

export const newIssueCommentInstant = {
  key: "newIssueCommentInstant",
  noun: "Comment",
  display: {
    label: "New Issue Comment",
    description: "Triggers when a new issue comment is created.",
  },
  operation: {
    inputFields: [
      {
        required: false,
        label: "Creator",
        key: "creatorId",
        helpText: "Only trigger on issue comments added by this user.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Team",
        key: "teamId",
        helpText: "Only trigger on issue comments created in this team.",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Issue ID",
        key: "issueId",
        helpText: "Only trigger on comments added to this issue identified by its ID.",
      },
    ],
    type: "hook",
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: getWebhookData,
    performList: getCommentList(),
    sample,
  },
};
