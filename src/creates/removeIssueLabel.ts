import { Bundle, ZObject } from "zapier-platform-core";

type RemoveIssueLabelResponse = {
  data?: {
    issueRemoveLabel: {
      success: boolean;
      issue: {
        id: string;
        title: string;
        url: string;
        identifier: string;
      };
    };
  };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
};

const removeIssueLabelRequest = async (z: ZObject, bundle: Bundle) => {
  const query = `
    mutation ZapierIssueRemoveLabel(
      $issueId: String!,
      $labelId: String!
    ) {
      issueRemoveLabel(
        id: $issueId,
        labelId: $labelId
      ) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }`;

  const variables = {
    issueId: bundle.inputData.issue_id,
    labelId: bundle.inputData.label_id,
  };

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

  const data = response.json as RemoveIssueLabelResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.issueRemoveLabel && data.data.issueRemoveLabel.success) {
    return data.data.issueRemoveLabel.issue;
  } else {
    throw new z.errors.Error(`Failed to remove label from issue`, "Something went wrong", 400);
  }
};

export const removeIssueLabel = {
  key: "remove_issue_label",

  display: {
    hidden: false,
    description: "Remove a label from an existing issue in Linear",
    label: "Remove Label from Issue",
  },

  noun: "Label",

  operation: {
    perform: removeIssueLabelRequest,

    inputFields: [
      {
        required: true,
        label: "Issue",
        key: "issue_id",
        dynamic: "issue.id.identifier",
        helpText: "The issue to remove the label from",
      },
      {
        required: true,
        label: "Label",
        key: "label_id",
        dynamic: "label.id.name",
        helpText: "The label to remove from the issue",
      },
    ],

    sample: {
      id: "7b647c45-c528-464d-8634-eecea0f73033",
      title: "Sample Issue",
      url: "https://linear.app/team-best-team/issue/ENG-123/sample-issue",
      identifier: "ENG-123",
    },
  },
};
