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
        issue: {
          id: string;
          identifier: string;
          title: string;
          url: string;
          team: {
            id: string;
            name: string;
          };
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
        } | null;
        documentContent: {
          id: string;
          content: string;
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

  const variables = {
    creatorId: bundle.inputData.creator_id,
    teamId: bundle.inputData.team_id,
    issueId: bundle.inputData.issue,
    projectUpdateProjectId: bundle.inputData.project_update_project_id,
    after: cursor,
  };

  const issueTeamFilter = variables.teamId ? `{ issue: { team: { id: { eq: $teamId } } } }` : "";
  const issueIdFilter = variables.issueId ? `{ issue: { id: { eq: $issueId } } }` : "";
  const projectUpdateProjectFilter = variables.projectUpdateProjectId
    ? `{ projectUpdate: { project: { id: { eq: $projectUpdateProjectId }}}}`
    : "";
  const creatorFilter = variables.creatorId ? `{ user: { id: { eq: $creatorId } } }` : "";

  let filterString = "";

  if (creatorFilter || issueTeamFilter || issueIdFilter || projectUpdateProjectFilter) {
    filterString = `filter: {
      and: [
        ${creatorFilter}
        ${issueTeamFilter}
        ${issueIdFilter}
        ${projectUpdateProjectFilter}
      ]
    }`;
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
        ${creatorFilter ? "$creatorId: ID" : ""}
        ${issueTeamFilter ? "$teamId: ID" : ""}
        ${issueIdFilter ? "$issueId: ID" : ""}
        ${projectUpdateProjectFilter ? "$projectUpdateProjectId: ID" : ""}
      ) {
        comments(
          first: 25
          after: $after
          ${filterString}
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
            documentContent {
              id
              content
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
        label: "Team",
        key: "team_id",
        helpText: "Only trigger on issue comments created to this team.",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Creator",
        key: "creator_id",
        helpText: "Only trigger on comments (issue, project updates, document comments) added by this user.",
        dynamic: "user.id.name",
        altersDynamicFields: true,
      },
      {
        required: false,
        label: "Issue ID",
        key: "issue",
        helpText: "Only trigger on comments added to this issue identified by its ID.",
      },
      {
        required: false,
        label: "Project Update Project ID",
        key: "project_update_project_id",
        helpText: "Only trigger on project update comments added to this project identified by its ID",
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
