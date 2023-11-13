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
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

const getCommentList = () => async (z: ZObject, bundle: Bundle) => {
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;

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
        $teamId: ID
        $issueId: ID
      ) {
        comments(
          first: 25
          after: $after
          filter: {
            and: [
              { user: { id: { eq: $creatorId } } }
              { issue: { team: { id: { eq: $teamId } } } }
              { issue: { id: { eq: $issueId } } }
            ]
          }
        ) {
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
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      variables: {
        creatorId: bundle.inputData.creator_id,
        teamId: bundle.inputData.team_id,
        issueId: bundle.inputData.issue,
        after: cursor,
      },
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

const getCommentListWithZohoDeskTicketId = () => async (z: ZObject, bundle: Bundle) => {
  const comments = await getCommentList()(z, bundle);

  return comments.filter((comment) => /^#\d+/.test(comment.issue.title) && comment.body.includes("#support"));
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
    canPaginate: true,
  },
};

export const newCommentWithZohoDeskTicketId = {
  ...comment,
  key: "newCommentWithZohoDeskTicketId",
  display: {
    label: "New Comment With Zoho Desk Ticket ID",
    description: "Triggers when a new comment is created to an issue with a Zoho Desk ticket ID.",
  },
  operation: {
    ...comment.operation,
    perform: getCommentListWithZohoDeskTicketId(),
    canPaginate: true,
  },
};
