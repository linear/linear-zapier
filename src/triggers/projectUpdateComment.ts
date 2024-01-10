import sample from "../samples/comment.json";
import { ZObject, Bundle } from "zapier-platform-core";

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

  const variables = {
    creatorId: bundle.inputData.creator_id,
    projectId: bundle.inputData.project_id,
    after: cursor,
  };

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
        $creatorId: ID
        $projectId: ID
      ) {
        comments(
          first: 25
          after: $after
          filter: {
            and: [
              { user: { id: { eq: $creatorId } } }
              { projectUpdate: { project: { id: { eq: $projectId }}}}
            ]
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
            projectUpdate {
              id
              body
              user {
                id
                name
                email
                avatarUrl
              }
              url
              project {
                id
                name
                url
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
        helpText: "Only trigger on project update comments added by this user.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Project ID",
        key: "project_id",
        helpText: "Only trigger on project update comments added to this project identified by its ID",
      },
    ],
    sample,
  },
};

export const newProjectUpdateComment = {
  ...comment,
  key: "newProjectUpdateComment",
  display: {
    label: "New Project Update Comment",
    description: "Triggers when a new project update comment is created.",
  },
  operation: {
    ...comment.operation,
    perform: getCommentList(),
    canPaginate: true,
  },
};
