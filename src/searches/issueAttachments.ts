import { Bundle, ZObject } from "zapier-platform-core";

interface issueAttachmentsRequestResponse {
    data?: { issue: { team: { name: String } } };
    errors?: {
      message: string;
      extensions?: {
        userPresentableMessage?: string;
      };
    }[];
  }

  const issueAttachmentsRequest = async (z: ZObject, bundle: Bundle) => {
    const variables = {
      id: bundle.inputData.issue
    };


    const query = `
      query issue(
        $id: String!
      ) {
        issue(
          id: $id
          ) {
          team {
            name
          }
          attachments {
            nodes {
              metadata
            }
          }
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

      const data = response.json as issueAttachmentsRequestResponse;
      z.console.log(JSON.stringify(data));

      if (data.errors && data.errors.length) {
        const error = data.errors[0];
        throw new z.errors.Error(
          (error.extensions && error.extensions.userPresentableMessage) || error.message,
          "invalid_input",
          400
        );
      }

      if (data.data &&  data.data.issue) {
        return [data.data.issue]
      } else {
        const error = data.errors ? data.errors[0].message : "Something went wrong2";
        throw new z.errors.Error(`Failed to create an attachment ${JSON.stringify(data)}`, "", 400);
      }
    };
  

    export const issueAttachments = {
      key: "issue_attachments",
    
      display: {
        hidden: false,
        important: true,
        description: "Get the attachments of an issue",
        label: "Get the attachments of an issue",
      },
    
      noun: "issueAttachments",
    
      operation: {
        perform: issueAttachmentsRequest,
    
        inputFields: [
          {
            required: true,
            label: "issue id",
            helpText: "The ID of the issue",
            key: "issue",
          },
        ],
        sample: { data: { success: true } },
      },
    };
    