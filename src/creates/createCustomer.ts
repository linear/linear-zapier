import { Bundle, ZObject } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";
import { omitBy } from "lodash";

interface CustomerCreateResponse {
  data?: {
    customerCreate: {
      customer: { id: string; name: string; domains: string[]; externalIds: string[] };
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

const createCustomerRequest = async (z: ZObject, bundle: Bundle) => {
  const variables = omitBy(
    {
      name: bundle.inputData.name,
      domains: bundle.inputData.domains || [],
      externalIds: bundle.inputData.externalIds || [],
      revenue: bundle.inputData.revenue,
      size: bundle.inputData.size,
      tierId: bundle.inputData.tierId,
    },
    (v) => v === undefined
  );
  const query = `
      mutation ZapierCustomerCreate(
        $name: String!,
        $domains: [String!],
        $externalIds: [String!],
        $revenue: Int,
        $size: Int,
        $tierId: String,
      ) {
        customerCreate(input: {
          name: $name,
          domains: $domains,
          externalIds: $externalIds,
          revenue: $revenue,
          size: $size,
          tierId: $tierId
        }) {
          customer {
            id
            name
            domains
            externalIds
          }
          success
        }
      }`;

  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = response.json as CustomerCreateResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.customerCreate && data.data.customerCreate.success) {
    return data.data.customerCreate.customer;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong";
    throw new z.errors.Error("Failed to create a customer", error, 400);
  }
};

export const createCustomer = {
  key: "createCustomer",
  display: {
    hidden: false,
    description: "Create a new customer in Linear",
    label: "Create Customer",
  },
  noun: "Customer",
  operation: {
    perform: createCustomerRequest,
    inputFields: [
      {
        required: true,
        label: "Name",
        helpText: "The name of the customer",
        key: "name",
      },
      {
        required: false,
        label: "Domains",
        helpText: "The domains associated with this customer",
        key: "domains",
        type: "text",
        list: true,
      },
      {
        required: false,
        label: "External IDs",
        helpText: "The ids of the customers in external systems",
        key: "externalIds",
        type: "text",
        list: true,
      },
      {
        required: false,
        label: "Revenue",
        helpText: "The annual revenue generated by the customer",
        key: "revenue",
        type: "number",
      },
      {
        required: false,
        label: "Size",
        helpText: "The size of the customer",
        key: "size",
        type: "number",
      },
      {
        required: false,
        label: "Tier ID",
        helpText: "The tier of the customer",
        key: "tierId",
        type: "text",
      },
    ],
    sample: {
      data: {
        customerCreate: {
          customer: {
            id: "068fbd0a-c1d5-448b-af2d-432127520cbd",
            domains: ["https://www.example.com"],
            name: "Example customer",
          },
          success: true,
        },
      },
    },
  },
};
