import { Bundle, ZObject } from "zapier-platform-core";


interface attachmentsForURLResponse {
    data?: { attachmentsForURL: { nodes: {id: string, sourceType:string, issue: { identifier: string, description: string, labels: {nodes: {id: string, name: string}[] }, state: { type: string }}}[] } };
    errors?: {
      message: string;
      extensions?: {
        userPresentableMessage?: string;
      };
    }[];
  }

  const attachmentsForURLRequest = async (z: ZObject, bundle: Bundle) => {
    const variables = {
      url: bundle.inputData.url
    };

    const query = `
      query attachmentsForURL(
        $url: String!
      ) {
          attachmentsForURL(url: $url) {
            nodes {
              id
              sourceType
              metadata
              issue {
                identifier
                description
                team {
                  key
                }
                state {
                  type
                }
                labels {
                  nodes {
                    id
                    name
                  }
                }
              }
            }
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


    const data = response.json as attachmentsForURLResponse;

    if (data.errors && data.errors.length) {
      const error = data.errors[0];
      throw new z.errors.Error(
        (error.extensions && error.extensions.userPresentableMessage) || error.message,
        "invalid_input",
        400
      );
    }

    if (data.data && data.data.attachmentsForURL) {
      let attachments = data.data.attachmentsForURL.nodes;
      // Filter by fields if set
      if (bundle.inputData.source_type) {
        attachments = attachments.filter((attachment) => attachment.sourceType === bundle.inputData.source_type);
      }
      if (bundle.inputData.description_pattern) {
        attachments = attachments.filter((attachment) => attachment.issue && attachment.issue.description &&
          attachment.issue.description.includes(bundle.inputData.description_pattern))
      }
      return attachments
    } else {
      const error = data.errors ? data.errors[0].message : "Something went wrong";
      throw new z.errors.Error(`Failed to create a comment`, error, 400);
    }
  }

    export const attachmentsForUrl = {
      key: "search_attachments_url",
    
      display: {
        hidden: false,
        important: true,
        description: "Search attachments for Url",
        label: "Search attachments for Url",
      },
    
      noun: "Attachment",
    
      operation: {
        perform: attachmentsForURLRequest,
    
        inputFields: [
          {
            required: true,
            label: "url",
            helpText: "The url of the attachment",
            key: "url",
          },
          {
            required: false,
            label: "Source",
            key: "source_type",
            helpText: "The attachment source type.",
          },
          {
            required: false,
            label: "Description Pattern",
            key: "description_pattern",
            helpText: "Description pattern",
          },
        ],
        sample: { data: { success: true } },
      },
    };
    