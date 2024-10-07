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
  projectUpdate: {
    id: string;
    body: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string;
    };
    url: string;
    project: {
      id: string;
      name: string;
      url: string;
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
        ? pick(bundle.inputData, ["creatorId", "projectId"])
        : undefined,
  };

  return z
    .request({
      url: "https://client-api.linear.app/connect/zapier/subscribe/commentProjectUpdate",
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

const getCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const variables: Record<string, string> = {};
  const variableSchema: Record<string, string> = {};
  const filters: unknown[] = [{ projectUpdate: { null: false } }];
  if (bundle.inputData.creatorId) {
    variableSchema.creatorId = "ID";
    variables.creatorId = bundle.inputData.creatorId;
    filters.push({ user: { id: { eq: new VariableType("creatorId") } } });
  }
  if (bundle.inputData.projectId) {
    variableSchema.projectId = "ID";
    variables.projectId = bundle.inputData.projectId;
    filters.push({ projectUpdate: { project: { id: { eq: new VariableType("projectId") } } } });
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
          projectUpdate: {
            id: true,
            body: true,
            user: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
            url: true,
            project: {
              id: true,
              name: true,
              url: true,
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

export const newProjectUpdateCommentInstant = {
  key: "newProjectUpdateCommentInstant",
  noun: "Comment",
  display: {
    label: "New Project Update Comment",
    description: "Triggers when a new project update comment is created.",
  },
  operation: {
    inputFields: [
      {
        required: false,
        label: "Creator",
        key: "creatorId",
        helpText: "Only trigger on project update comments added by this user.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Project",
        key: "projectId",
        helpText: "Only trigger on project update comments tied to this project.",
        dynamic: "projectWithoutTeam.id.name",
        altersDynamicFields: true,
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
