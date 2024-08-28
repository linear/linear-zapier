import { omitBy } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/projectUpdateComment.json";

interface Comment {
  id: string;
  body: string;
  url: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvingUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  } | null;
  project: {
    id: string;
    name: string;
    url: string;
  } | null;
  documentContent: {
    id: string;
    createdAt: string;
    document: {
      id: string;
      title: string;
      project: {
        id: string;
        name: string;
        url: string;
      };
    };
  } | null;
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
  z.console.log("bundle while subscribing", bundle);

  // bundle.targetUrl has the Hook URL this app should call when a recipe is created.
  // https://platform.zapier.com/build/bundle#targeturl
  const data = {
    url: bundle.targetUrl,
    inputData: bundle.inputData,
  };

  // You may return a promise or a normal data structure from any perform method.

  // If your webhook subscriptions expire, make sure the subscribe endpoint returns an `expiration_date` property containing an ISO8601 date.
  // The platform will automatically attempt to resubscribe after the expiration date. More details here: https://platform.zapier.com/build/cli-hook-trigger#prerequisites

  return z
    .request({
      url: "https://linear-dev-zapier.ngrok.io/hooks/zapier/subscribe/commentDocument",
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

const unsubscribeHook = (z: ZObject, bundle: Bundle) => {
  // bundle.subscribeData contains the parsed response JSON from the subscribe request.
  const hookId = bundle.subscribeData?.id;

  // You may return a promise or a normal data structure from any perform method.
  return z
    .request({
      url: `https://linear-dev-zapier.ngrok.io/hooks/zapier/unsubscribe/${hookId}`,
      method: "DELETE",
    })
    .then((response) => response.data);
};

const getComment = (z: ZObject, bundle: Bundle) => {
  z.console.log("cleaned request", bundle.cleanedRequest);

  // bundle.cleanedRequest will include the parsed JSON object (if it's not a
  // test poll) and also a .querystring property with the URL's query string.
  const comment = {
    ...bundle.cleanedRequest,
    querystring: undefined,
  };

  return [comment];
};

const getCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const variables = omitBy(
    {
      creatorId: bundle.inputData.creator_id,
      projectId: bundle.inputData.project_id,
      documentId: bundle.inputData.document_id,
    },
    (v) => v === undefined
  );

  const filters = [];
  if ("creatorId" in variables) {
    filters.push(`{ user: { id: { eq: $creatorId } } }`);
  }
  if ("projectId" in variables) {
    filters.push(`{ documentContent: { project: { id: { eq: $projectId }} } }`);
    filters.push(`{ documentContent: { document: { project: { id: { eq: $projectId }}}}}`);
  }
  if ("documentId" in variables) {
    filters.push(`{ documentContent: { document: { id: { eq: $documentId }}}}`);
  }

  z.console.log("bundle", bundle);
  const response = await z.request({
    url: "https://linear-dev-zapier.ngrok.io/graphql",
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
            resolvingUser {
              id
              name
              email
              avatarUrl
            }
            documentContent {
              id
              createdAt
              updatedAt
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
  const comments = data.comments.nodes;

  return comments.map((comment) => ({
    ...comment,
    id: `${comment.id}-${comment.createdAt}`,
    commentId: comment.id,
  }));
};

export const newDocumentCommentV2 = {
  key: "newDocumentCommentV2",
  noun: "Comment",
  display: {
    label: "New Document Comment V2",
    description: "Triggers when a new document comment is created.",
  },
  operation: {
    inputFields: [
      {
        required: false,
        label: "Creator",
        key: "creator_id",
        helpText: "Only trigger on document comments added by this user.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Project ID",
        key: "project_id",
        helpText: "Only trigger on comments added to the documents in the project with this ID.",
      },
      {
        required: false,
        label: "Document ID",
        key: "document_id",
        helpText: "Only trigger on comments added to the document with this ID.",
      },
    ],
    type: "hook",
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: getComment,
    performList: getCommentList(),
    outputFields: [
      { key: "id", label: "ID" },
      { key: "body", label: "Body" },
    ],
    sample,
  },
  // hidden: true,
};
