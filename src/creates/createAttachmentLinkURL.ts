import { Bundle, ZObject } from "zapier-platform-core";

interface createAttachmentLinkURLRequestResponse {
    data?: { attachmentLinkURL: { success: boolean } };
    errors?: {
      message: string;
      extensions?: {
        userPresentableMessage?: string;
      };
    }[];
  }

  const createAttachmentLinkURLRequest = async (z: ZObject, bundle: Bundle) => {
    const variables = {
      issueId: bundle.inputData.issue,
      url: bundle.inputData.url,
      title: bundle.inputData.title
    };


    const query = `
      mutation attachmentLinkURL(
        $issueId: String!,
        $url: String!,
        $title: String!
      ) {
        attachmentLinkURL(
          issueId: $issueId,
          title: $title,
          url: $url) {
          success
        }
      }`;

      z.console.log(JSON.stringify(query));
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

      const data = response.json as createAttachmentLinkURLRequestResponse;
      z.console.log(JSON.stringify(data));

      if (data.errors && data.errors.length) {
        const error = data.errors[0];
        throw new z.errors.Error(
          (error.extensions && error.extensions.userPresentableMessage) || error.message,
          "invalid_input",
          400
        );
      }

      if (data.data &&  data.data.attachmentLinkURL && data.data.attachmentLinkURL.success) {
        return data.data.attachmentLinkURL
      } else {
        const error = data.errors ? data.errors[0].message : "Something went wrong2";
        throw new z.errors.Error(`Failed to create an attachment ${JSON.stringify(data)}`, "", 400);
      }
    };
  

    export const createAttachmentLinkURL = {
      key: "create_attachment_link_URL",
    
      display: {
        hidden: false,
        important: true,
        description: "Link an existing URL  to an issue.",
        label: "Link an existing URL  to an issue.",
      },
    
      noun: "AttachmentLinkURL",
    
      operation: {
        perform: createAttachmentLinkURLRequest,
    
        inputFields: [
          {
            required: true,
            label: "Title",
            helpText: "Title",
            key: "title",
          },
          {
            required: true,
            label: "IssueId",
            helpText: "The ID of the issue. Both UUID and application ID formats are accepted.",
            key: "issue",
          },
          {
            required: true,
            label: "ConversationId",
            helpText: "The ID of the conversation",
            key: "conversation",
          },
        ],
        sample: { data: { success: true } },
      },
    };
    