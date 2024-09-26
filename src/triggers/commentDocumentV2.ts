import { omitBy, pick } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/documentComment.json";

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
 * Deletes a webhook subscription for document comments in Linear.
 * @see https://platform.zapier.com/build/cli-hook-trigger#2-write-the-unsubscribehook-function
 * @see https://platform.zapier.com/build/cli-hook-trigger#unsubscribehook
 */
const unsubscribeHook = (z: ZObject, bundle: Bundle) => {
  // bundle.subscribeData contains the parsed response JSON from the subscribe request.
  const hookId = bundle.subscribeData?.id;

  return z
    .request({
      url: `https://client-api.linear.app/connect/zapier/unsubscribe/${hookId}`,
      method: "DELETE",
    })
    .then((response) => response.data);
};

/**
 * This processes inbound webhooks from Linear.
 * @see https://platform.zapier.com/build/cli-hook-trigger#3-write-the-perform-function
 * @see https://platform.zapier.com/build/cli-hook-trigger#perform
 */
const getComment = (z: ZObject, bundle: Bundle) => {
  const comment = {
    ...bundle.cleanedRequest.data,
    querystring: undefined,
  };

  return [comment];
};

/**
 * Fetches a list of comments from Linear to use as examples when building a Zap.
 * @see https://platform.zapier.com/build/cli-hook-trigger#4-write-the-performlist-function
 * @see https://platform.zapier.com/build/cli-hook-trigger#performlist
 */
const getCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const variables = omitBy(
    {
      creatorId: bundle.inputData.creatorId,
      projectId: bundle.inputData.projectId,
      documentId: bundle.inputData.documentId,
    },
    (v: undefined) => v === undefined
  );

  const filters = [` { and: [{ documentContent: { null: false } }] }`];
  if ("creatorId" in variables) {
    filters.push(`{ user: { id: { eq: $creatorId } } }`);
  }
  if ("projectId" in variables) {
    filters.push(
      `{ or: [{ documentContent: { project: { id: { eq: $projectId }} } }, { documentContent: { document: { project: { id: { eq: $projectId }}}}}] }`
    );
  }
  if ("documentId" in variables) {
    filters.push(`{ documentContent: { document: { id: { eq: $documentId }}}}`);
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
        ${"projectId" in variables ? "$projectId: ID" : ""}
        ${"documentId" in variables ? "$documentId: ID" : ""}
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
            documentContent {
              project {
                id
                name
                url
              }
              document {
                id
                title
                project {
                  id
                  name
                  url
                }
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
    perform: getComment,
    performList: getCommentList(),
    sample,
  },
};
