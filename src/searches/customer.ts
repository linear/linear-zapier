import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/customer.json";
import { CustomerCommon } from "../triggers/customer";

interface CustomerResponse {
  data: {
    customer: CustomerCommon;
  };
}

const getCustomer = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query Customer {
        customer(id: "${bundle.inputData.id}") {
          id
          name
          domains
          externalIds
          createdAt
          updatedAt
          revenue
          size
          tier {
            id
            name
          }
        }
      }`,
    },
    method: "POST",
  });
  const data = (response.json as CustomerResponse).data;
  const customer = data.customer;

  return [customer];
};

export const findCustomerByID = {
  key: "customer",
  noun: "Customer",

  display: {
    label: "Find Customer by ID",
    hidden: false,
    description: "Find a customer by ID",
  },

  operation: {
    perform: getCustomer,
    inputFields: [
      {
        key: "id",
        required: true,
        label: "Customer ID",
      },
    ],
    sample,
  },
};
