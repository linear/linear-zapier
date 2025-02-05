import {Bundle, ZObject} from "zapier-platform-core";
import sample from "../samples/customer.json";
import {getWebhookData, unsubscribeHook} from "../handleWebhook";
import {jsonToGraphQLQuery} from "json-to-graphql-query";
import {fetchFromLinear} from "../fetchFromLinear";

export interface CustomerNeedCommon {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    customerId?: string;
    issueId?: string;
    attachmentId?: string;
    body?: string;
    priority?: number;
}

interface CustomerNeedsResponse {
    data: {
        customerNeeds: {
            nodes: CustomerNeedCommon[];
        };
    };
}

const subscribeHook = (eventType: "create" | "update") => async (z: ZObject, bundle: Bundle) => {
    const data = {
        url: bundle.targetUrl,
    };
    const webhookType = eventType === "create" ? "createCustomerNeed" : "updateCustomerNeed";

    return z
        .request({
            url: `https://client-api.linear.app/connect/zapier/subscribe/${webhookType}`,
            method: "POST",
            body: data,
        })
        .then((response) => response.data);
};

const getCustomerNeedsList =
    () =>
        async (z: ZObject, bundle: Bundle): Promise<CustomerNeedCommon[]> => {
            const variables: Record<string, string> = {};
            const variableSchema: Record<string, string> = {};

            const jsonQuery = {
                query: {
                    __variables: variableSchema,
                    customerNeeds: {
                        __args: {
                            first: 25,
                        },
                        nodes: {
                            id: true,
                            createdAt: true,
                            updatedAt: true,
                            body: true,
                            priority: true,
                            customer: {
                                id: true
                            },
                            issue: {
                                id: true
                            },
                            attachment: {
                                id: true
                            }
                        },
                    },
                },
            };
            const query = jsonToGraphQLQuery(jsonQuery);
            const response = await fetchFromLinear(z, bundle, query, variables);
            const data = (response.json as CustomerNeedsResponse).data;
            return data.customerNeeds.nodes;
        };

const operationBase = {
    type: "hook",
    perform: getWebhookData,
    performUnsubscribe: unsubscribeHook,
    performList: getCustomerNeedsList(),
    sample,
};

export const newCustomerNeedInstant = {
    noun: "Customer Need",
    key: "newCustomerNeedInstant",
    display: {
        label: "New Customer Need",
        description: "Triggers when a new customer request is created.",
    },
    operation: {
        ...operationBase,
        performSubscribe: subscribeHook("create"),
    },
};

export const updatedCustomerNeedInstant = {
    noun: "Customer Need",
    key: "updatedCustomerNeedInstant",
    display: {
        label: "Updated Customer Need",
        description: "Triggers when a customer request is updated.",
    },
    operation: {
        ...operationBase,
        performSubscribe: subscribeHook("update"),
    },
};
