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
      }[];
    };
  };
}

const getCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;
  const filter = [];

  if (bundle.inputData.creator_id) {
    filter.push({
      user: {
        id: {
          eq: bundle.inputData.creator_id
        }
      }
    })
  }

  if (bundle.inputData.team_id) {
    filter.push({
      issue: {
        team: {
          id: {
            eq: bundle.inputData.team_id
          }
        }
      }
    })
  }

  if (bundle.inputData.issue) {
    filter.push({
      issue: {
        id: {
          eq: bundle.inputData.issue
        }
      }
    })
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
      query ListComments($after: String, $filter: CommentFilter) {
        comments(first: 25) {
          nodes {
            id
            body
            createdAt
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
          }
        }
      }`,
      variables: {
        ...(filter.length ? { filter: { and: filter } } : {}),
        after: cursor
      },
    },
    method: "POST",
  });

  const data = (response.json as CommentsResponse).data;
  let comments = data.comments.nodes;

  // Set cursor for pagination
  const nextCursor = comments?.[comments.length - 1]?.id
  if (nextCursor) {
    await z.cursor.set(nextCursor);
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
        label: "Team",
        key: "team_id",
        helpText: "Only trigger on comments created to this team.",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Creator",
        key: "creator_id",
        helpText: "Only trigger on comments added by this user.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Issue ID",
        key: "issue",
        helpText: "Only trigger on comments added to this issue identified by its ID (UUID or application ID).",
      },
    ],
    sample,
  },
};

export const newComment = {
  ...comment,
  key: "newComment",
  display: {
    label: "New Comment",
    description: "Triggers when a new comment is created.",
  },
  operation: {
    ...comment.operation,
    perform: getCommentList(),
  },
};
