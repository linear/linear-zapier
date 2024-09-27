import { pick } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/documentComment.json";
import { getWebhookData, unsubscribeHook } from "../handleWebhook";
import { jsonToGraphQLQuery } from "json-to-graphql-query";

interface Comment {
  id: string;
  body: string;
  url: string;
  createdAt: string;
  resolvedAt: string | null;
  documentContent: {
    project: {
      id: string;
      name: string;
      url: string;
    } | null;
    document: {
      id: string;
      title: string;
      project: {
        id: string;
        name: string;
        url: string;
      };
    } | null;
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

/**
 * Sets up a new webhook subscription for document comments in Linear.
 * @see https://platform.zapier.com/build/cli-hook-trigger#1-write-the-subscribehook-function
 * @see https://platform.zapier.com/build/cli-hook-trigger#subscribehook
 */
const subscribeHook = (z: ZObject, bundle: Bundle) => {
  const data = {
    url: bundle.targetUrl,
    inputData:
      bundle.inputData && Object.keys(bundle.inputData).length > 0
        ? pick(bundle.inputData, ["creatorId", "projectId", "documentId"])
        : undefined,
  };

  return z
    .request({
      url: "https://client-api.linear.app/connect/zapier/subscribe/commentDocument",
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

/**
 * Fetches a list of comments from Linear to use as examples when building a Zap.
 * @see https://platform.zapier.com/build/cli-hook-trigger#4-write-the-performlist-function
 * @see https://platform.zapier.com/build/cli-hook-trigger#performlist
 */
const getCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const filters: unknown[] = [{ documentContent: { null: false } }];
  if (bundle.inputData.creatorId) {
    filters.push({ user: { id: { eq: bundle.inputData.creatorId } } });
  }
  if (bundle.inputData.projectId) {
    filters.push({
      or: [
        { documentContent: { project: { id: { eq: bundle.inputData.projectId } } } },
        { documentContent: { document: { project: { id: { eq: bundle.inputData.projectId } } } } },
      ],
    });
  }
  if (bundle.inputData.documentId) {
    filters.push({ documentContent: { document: { id: { eq: bundle.inputData.documentId } } } });
  }
  const filter = { and: filters };

  const jsonQuery = {
    query: {
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
          documentContent: {
            project: {
              id: true,
              name: true,
              url: true,
            },
            document: {
              id: true,
              title: true,
              project: {
                id: true,
                name: true,
                url: true,
              },
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

  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: jsonToGraphQLQuery(jsonQuery),
    },
    method: "POST",
  });

  const data = (response.json as CommentsResponse).data;
  return data.comments.nodes;
};

export const newDocumentCommentInstant = {
  key: "newDocumentCommentV2",
  noun: "Comment",
  display: {
    label: "New Document Comment",
    description: "Triggers when a new document comment is created.",
  },
  operation: {
    inputFields: [
      {
        required: false,
        label: "Creator",
        key: "creatorId",
        helpText: "Only trigger on document comments added by this user.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Project ID",
        key: "projectId",
        helpText: "Only trigger on comments added to the documents or project description in the project with this ID.",
      },
      {
        required: false,
        label: "Document ID",
        key: "documentId",
        helpText: "Only trigger on comments added to the document with this ID.",
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
