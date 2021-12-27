import { Bundle, ZObject } from "zapier-platform-core";

interface createAttachmentLinkIntercomRequestResponse {
    data?: { attachmentLinkIntercom: { success: boolean } };
    errors?: {
      message: string;
      extensions?: {
        userPresentableMessage?: string;
      };
    }[];
  }

  const createAttachmentLinkIntercomRequest = async (z: ZObject, bundle: Bundle) => {
    const variables = {
      issueId: bundle.inputData.issue,
      conversationId: bundle.inputData.conversation,
    };


    const query = `
      mutation attachmentLinkIntercom(
        $issueId: String!,
        $conversationId: String!
      ) {
        attachmentLinkIntercom(
          issueId: $issueId,
          conversationId: $conversationId) {
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

      const data = response.json as createAttachmentLinkIntercomRequestResponse;
      z.console.log(JSON.stringify(data));

      if (data.errors && data.errors.length) {
        const error = data.errors[0];
        throw new z.errors.Error(
          (error.extensions && error.extensions.userPresentableMessage) || error.message,
          "invalid_input",
          400
        );
      }

      if (data.data &&  data.data.attachmentLinkIntercom && data.data.attachmentLinkIntercom.success) {
        return true
      } else {
        const error = data.errors ? data.errors[0].message : "Something went wrong2";
        throw new z.errors.Error(`Failed to create an attachment ${JSON.stringify(data)}`, "", 400);
      }
    };
  

    export const createAttachmentLinkIntercom = {
      key: "create_attachment_link_intercom",
    
      display: {
        hidden: false,
        important: true,
        description: "Link an existing Intercom conversation to an issue.",
        label: "Link an existing Intercom conversation to an issue.",
      },
    
      noun: "AttachmentLinkIntercom",
    
      operation: {
        perform: createAttachmentLinkIntercomRequest,
    
        inputFields: [
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
    