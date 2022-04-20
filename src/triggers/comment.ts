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

const buildCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query GetCommentList {
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
      }`
    },
    method: "POST",
  });

  const data = (response.json as CommentsResponse).data;
  let comments = data.comments.nodes;

  // Filter by fields if set
  if (bundle.inputData.creator_id) {
    z.console.log("comment cretor filter", bundle.inputData.creator_id, comments.map((comment) => comment.user.id));
    comments = comments.filter((comment) => comment.user.id === bundle.inputData.creator_id);
  }
  if (bundle.inputData.team_id) {
    comments = comments.filter((comment) => comment.issue.team.id === bundle.inputData.team_id);
  }
  if (bundle.inputData.issue) {
    comments = comments.filter(
      (comment) => comment.issue.id === bundle.inputData.issue || comment.issue.identifier === bundle.inputData.issue
    );
  }


  z.console.log("comment response", comments);

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
    perform: buildCommentList(),
  },
};
