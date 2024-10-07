import { pick } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/issueComment.json";
import { getWebhookData, unsubscribeHook } from "../handleWebhook";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";
import { fetchFromLinear } from "../fetchFromLinear";

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
  const variables: Record<string, string> = {};
  const variableSchema: Record<string, string> = {};
  const filters: unknown[] = [{ issue: { null: false } }];
  if (bundle.inputData.creatorId) {
    variableSchema.creatorId = "ID";
    variables.creatorId = bundle.inputData.creatorId;
    filters.push({ user: { id: { eq: new VariableType("creatorId") } } });
  }
  if (bundle.inputData.teamId) {
    variableSchema.teamId = "ID";
    variables.teamId = bundle.inputData.teamId;
    filters.push({ issue: { team: { id: { eq: new VariableType("teamId") } } } });
  }
  if (bundle.inputData.issueId) {
    variableSchema.issueId = "ID";
    variables.issueId = bundle.inputData.issueId;
    filters.push({ issue: { id: { eq: new VariableType("issueId") } } });
  }
  const filter = { and: filters };

  const jsonQuery = {
    query: {
      __variables: variableSchema,
      comments: {
        __args: {
          first: 25,
          filter,
        },
        nodes: {
          id: true,
          body: true,
          createdAt: true,
          resolvedAt: true,
          issue: {
            id: true,
            identifier: true,
            title: true,
            url: true,
            team: {
              id: true,
              name: true,
            },
          },
          user: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
          parent: {
            id: true,
            body: true,
            createdAt: true,
            user: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  };
  const query = jsonToGraphQLQuery(jsonQuery);
  const response = await fetchFromLinear(z, bundle, query, variables);
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
    perform: getWebhookData("create"),
    performList: getCommentList(),
    sample,
  },
};
