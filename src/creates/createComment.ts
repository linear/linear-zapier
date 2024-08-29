import { Bundle, ZObject } from "zapier-platform-core";

interface CreateCommentRequestResponse {
  data?: { commentCreate: { comment: { id: string; url: string }; success: boolean } };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
}

const createCommentRequest = async (z: ZObject, bundle: Bundle) => {
  const variables = {
    issueId: bundle.inputData.issue,
    body: bundle.inputData.body,
  };

  const query = `
      mutation ZapierCommentCreate(
        $issueId: String!,
        $body: String!
      ) {
        commentCreate(input: {
          issueId: $issueId,
          body: $body
        }) {
          comment {
            id
            url
          }
          success
        }
      }`;

  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query,
      variables,
    },
    method: "POST",
  });

  const data = response.json as CreateCommentRequestResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.commentCreate && data.data.commentCreate.success) {
    return data.data.commentCreate.comment;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong";
    throw new z.errors.Error(`Failed to create a comment`, error, 400);
  }
};

export const createComment = {
  key: "create_comment",

  display: {
    hidden: false,
    description: "Create a new issue comment in Linear",
    label: "Create Comment",
  },

  noun: "Comment",

  operation: {
    perform: createCommentRequest,

    inputFields: [
      {
        required: true,
        label: "Issue",
        helpText: "The ID of the issue. Both UUID and application ID formats are accepted.",
        key: "issue",
      },
      {
        required: true,
        label: "Comment Body",
        helpText: "The text body of the comment in markdown.",
        key: "body",
      },
    ],
    sample: { data: { issueCreate: { success: true } } },
  },
};
