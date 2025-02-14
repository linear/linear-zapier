import { Bundle, ZObject } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";
import { omitBy } from "lodash";

interface CustomerNeedCreateResponse {
  data?: {
    customerNeedCreate: {
      need: { id: string; customerId?: string; issueId?: string; attachmentId?: string };
      success: boolean;
    };
  };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
}

const createCustomerNeedRequest = async (z: ZObject, bundle: Bundle) => {
  const variables = omitBy(
    {
      customerId: bundle.inputData.customerId,
      customerExternalId: bundle.inputData.customerExternalId,
      issueId: bundle.inputData.issueId,
      attachmentId: bundle.inputData.attachmentId,
      attachmentUrl: bundle.inputData.attachmentUrl,
      body: bundle.inputData.body,
      priority: bundle.inputData.priority,
    },
    (v) => v === undefined
  );

  if (variables.attachmentId && variables.attachmentUrl) {
    throw new Error("Cannot specify both attachmentId and attachmentUrl");
  } else if (variables.customerId && variables.customerExternalId) {
    throw new Error("Cannot specify both customerId and customerExternalId");
  }

  const query = `
      mutation ZapierCustomerNeedCreate(
        $customerId: String,
        $customerExternalId: String,
        $issueId: String,
        $attachmentId: String,
        $attachmentUrl: String,
        $body: String,
        $priority: Float,
      ) {
        customerNeedCreate(input: {
          customerId: $customerId,
          customerExternalId: $customerExternalId,
          issueId: $issueId,
          attachmentId: $attachmentId,
          attachmentUrl: $attachmentUrl,
          body: $body,
          priority: $priority,
        }) {
          need {
            id
            customer {
              id
            }
            issue {
              id
            }
            attachment {
              id
            }
          }
          success
        }
      }`;

  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = response.json as CustomerNeedCreateResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.customerNeedCreate && data.data.customerNeedCreate.success) {
    return data.data.customerNeedCreate.need;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong";
    throw new z.errors.Error("Failed to create a customer need", error, 400);
  }
};

export const createCustomerNeed = {
  key: "createCustomerNeed",
  display: {
    hidden: false,
    description: "Create a new customer need in Linear",
    label: "Create Customer Need",
  },
  noun: "Customer Need",
  operation: {
    perform: createCustomerNeedRequest,
    inputFields: [
      {
        required: false,
        label: "Customer ID",
        helpText: "The ID of the customer to create the need for",
        key: "customerId",
      },
      {
        required: false,
        label: "External Customer ID",
        helpText: "The external ID of the customer the need belongs to",
        key: "customerExternalId",
      },
      {
        required: false,
        label: "Issue ID",
        helpText: "The ID of the issue this need is for",
        key: "issueId",
        type: "text",
      },
      {
        required: false,
        label: "Attachment ID",
        helpText: "The ID of the attachment this need is associated with",
        key: "attachmentId",
        type: "text",
      },
      {
        required: false,
        label: "Attachment URL",
        helpText: "Optional URL for the attachment associated with the customer need",
        key: "attachmentUrl",
        type: "text",
      },
      {
        required: false,
        label: "Body",
        helpText: "The content of the need in markdown format.",
        key: "body",
        type: "text",
      },
      {
        required: false,
        label: "Priority",
        helpText: "Whether the customer need is important or not. 0 = Not important, 1 = Important.",
        key: "priority",
        type: "number",
      },
    ],
    sample: {
      data: {
        customerNeedCreate: {
          need: {
            id: "93a02c29-da90-4d06-ab1c-96956e94bcd0",
            customerId: "6465f500-6626-4253-9073-144535a6c658",
            issueId: "a8ea3bfa-5420-492a-84e9-ffe49ca5f22a",
          },
          success: true,
        },
      },
    },
  },
};
