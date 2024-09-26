import { omitBy } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/projectUpdateComment.json";

interface CommentsResponse {
  data: {
    comments: {
      nodes: {
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
      }[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

const getCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;

  const variables = omitBy(
    {
      creatorId: bundle.inputData.creator_id,
      projectId: bundle.inputData.project_id,
      documentId: bundle.inputData.document_id,
      after: cursor,
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

  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query ZapierListComments(
        $after: String
        ${"creatorId" in variables ? "$creatorId: ID" : ""}
        ${"projectId" in variables ? "$projectId: ID" : ""}
        ${"documentId" in variables ? "$documentId: ID" : ""}
      ) {
        comments(
          first: 25
          after: $after
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
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      variables: variables,
    },
    method: "POST",
  });

  const data = (response.json as CommentsResponse).data;
  const comments = data.comments.nodes;

  // Set cursor for pagination
  if (data.comments.pageInfo.hasNextPage) {
    await z.cursor.set(data.comments.pageInfo.endCursor);
  }

  return comments.map((comment) => ({
    ...comment,
    id: `${comment.id}-${comment.createdAt}`,
    commentId: comment.id,
  }));
};

const comment = {
  noun: "Comment",

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
    sample,
  },
};

export const newDocumentComment = {
  ...comment,
  key: "newDocumentComment",
  display: {
    label: "New Document Comment",
    description: "Triggers when a new document comment is created.",
    hidden: true,
  },
  operation: {
    ...comment.operation,
    perform: getCommentList(),
    canPaginate: true,
  },
};
