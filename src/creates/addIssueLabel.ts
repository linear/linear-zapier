import { Bundle, ZObject } from "zapier-platform-core";

type AddIssueLabelResponse = {
  data?: {
    issueAddLabel: {
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

const addIssueLabelRequest = async (z: ZObject, bundle: Bundle) => {
  const query = `
    mutation ZapierIssueAddLabel(
      $issueId: String!,
      $labelId: String!
    ) {
      issueAddLabel(
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

  const data = response.json as AddIssueLabelResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.issueAddLabel && data.data.issueAddLabel.success) {
    return data.data.issueAddLabel.issue;
  } else {
    throw new z.errors.Error(`Failed to add label to issue`, "Something went wrong", 400);
  }
};

export const addIssueLabel = {
  key: "add_issue_label",

  display: {
    hidden: false,
    description: "Add a label to an existing issue in Linear",
    label: "Add Label to Issue",
  },

  noun: "Label",

  operation: {
    perform: addIssueLabelRequest,

    inputFields: [
      {
        required: true,
        label: "Issue",
        key: "issue_id",
        dynamic: "issue.id.identifier",
        helpText: "The issue to add the label to",
      },
      {
        required: true,
        label: "Label",
        key: "label_id",
        dynamic: "label.id.name",
        helpText: "The label to add to the issue",
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
