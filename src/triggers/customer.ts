import {Bundle, ZObject} from "zapier-platform-core";
import sample from "../samples/customer.json";
import {getWebhookData, unsubscribeHook} from "../handleWebhook";
import {jsonToGraphQLQuery} from "json-to-graphql-query";
import {fetchFromLinear} from "../fetchFromLinear";

export interface CustomerCommon {
  id: string;
  name: string;
  domains: string[];
  externalIds: string[];
  createdAt: Date;
  updatedAt: Date;
  revenue?: number;
  size?: number;
  tier?: {
    id: string;
    name: string;
  };
}

interface CustomersResponse {
  data: {
    customers: {
      nodes: CustomerCommon[];
    };
  };
}

const subscribeHook = (eventType: "create" | "update") => async (z: ZObject, bundle: Bundle) => {
  const data = {
    url: bundle.targetUrl,
  };
  const webhookType = eventType === "create" ? "createCustomer" : "updateCustomer";

  return z
    .request({
      url: `https://client-api.linear.app/connect/zapier/subscribe/${webhookType}`,
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

const getCustomerList =
  () =>
  async (z: ZObject, bundle: Bundle): Promise<CustomerCommon[]> => {
    const variables: Record<string, string> = {};
    const variableSchema: Record<string, string> = {};

    const jsonQuery = {
      query: {
        __variables: variableSchema,
        customers: {
          __args: {
            first: 25,
          },
          nodes: {
            id: true,
            name: true,
            domains: true,
            externalIds: true,
            createdAt: true,
            updatedAt: true,
            revenue: true,
            size: true,
            tier: {
              id: true,
              name: true,
            },
          },
        },
      },
    };
    const query = jsonToGraphQLQuery(jsonQuery);
    const response = await fetchFromLinear(z, bundle, query, variables);
    const data = (response.json as CustomersResponse).data;
    return data.customers.nodes;
  };

const operationBase = {
  type: "hook",
  perform: getWebhookData,
  performUnsubscribe: unsubscribeHook,
  performList: getCustomerList(),
  sample,
};

export const newCustomerInstant = {
  noun: "Customer",
  key: "newCustomerInstant",
  display: {
    label: "New Customer",
    description: "Triggers when a new customer is created.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("create"),
  },
};

export const updatedCustomerInstant = {
  noun: "Customer",
  key: "updatedCustomerInstant",
  display: {
    label: "Updated Customer",
    description: "Triggers when a customer is updated.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("update"),
  },
};
