import { Bundle, ZObject } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";

interface AttachmentCreateResponse {
  data?: { attachmentCreate: { attachment: { id: string; url: string; title: string }; success: boolean } };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
}

const createAttachmentRequest = async (z: ZObject, bundle: Bundle) => {
  const variables = {
    issueId: bundle.inputData.issue,
    url: bundle.inputData.url,
    title: bundle.inputData.title || "",
  };

  const query = `
      mutation ZapierAttachmentCreate(
        $issueId: String!,
        $url: String!,
        $title: String!
      ) {
        attachmentCreate(input: {
          issueId: $issueId,
          url: $url,
          title: $title
        }) {
          attachment {
            id
            url
            title
          }
          success
        }
      }`;

  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = response.json as AttachmentCreateResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.attachmentCreate && data.data.attachmentCreate.success) {
    return data.data.attachmentCreate.attachment;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong";
    throw new z.errors.Error("Failed to create an attachment", error, 400);
  }
};

export const createIssueAttachment = {
  key: "createIssueAttachment",
  display: {
    hidden: false,
    description: "Create a new issue URL attachment in Linear",
    label: "Create Issue Attachment",
  },
  noun: "Attachment",
  operation: {
    perform: createAttachmentRequest,
    inputFields: [
      {
        required: true,
        label: "Issue",
        helpText: "The ID of the issue. Both UUID and issue identifier formats are accepted.",
        key: "issue",
      },
      {
        required: true,
        label: "URL",
        helpText: "The URL of this attachment.",
        key: "url",
      },
      {
        required: false,
        label: "Title",
        helpText: "The title of this attachment.",
        key: "title",
      },
    ],
    sample: {
      data: {
        attachmentCreate: {
          attachment: { id: "a25cce1b-510d-433f-af50-1373efc05a4a", url: "https://www.example.com", title: "My title" },
          success: true,
        },
      },
    },
  },
};
