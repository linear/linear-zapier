import { pick } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/initiativeUpdate.json";
import { getWebhookData, unsubscribeHook } from "../handleWebhook";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";
import { fetchFromLinear } from "../fetchFromLinear";

interface InitiativeUpdate {
  id: string;
  body: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  health: string;
  initiative: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface InitiativeUpdatesResponse {
  data: {
    initiativeUpdates: {
      nodes: InitiativeUpdate[];
    };
  };
}

type EventType = "create" | "update";

const subscribeHook = (eventType: EventType) => async (z: ZObject, bundle: Bundle) => {
  const data = {
    url: bundle.targetUrl,
    inputData:
      bundle.inputData && Object.keys(bundle.inputData).length > 0
        ? pick(bundle.inputData, ["creatorId", "initiativeId"])
        : undefined,
  };

  const webhookType = eventType === "create" ? "createInitiativeUpdate" : "updateInitiativeUpdate";
  return z
    .request({
      url: `https://client-api.linear.app/connect/zapier/subscribe/${webhookType}`,
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

const getInitiativeUpdateList = () => async (z: ZObject, bundle: Bundle) => {
  const variables: Record<string, string> = {};
  const variableSchema: Record<string, string> = {};
  const filters: unknown[] = [];
  if (bundle.inputData.creatorId) {
    variableSchema.creatorId = "ID";
    variables.creatorId = bundle.inputData.creatorId;
    filters.push({ user: { id: { eq: new VariableType("creatorId") } } });
  }
  if (bundle.inputData.initiativeId) {
    variableSchema.initiativeId = "ID";
    variables.initiativeId = bundle.inputData.initiativeId;
    filters.push({ initiative: { id: { eq: new VariableType("initiativeId") } } });
  }
  const filter = { and: filters };

  const jsonQuery = {
    query: {
      __variables: variableSchema,
      initiativeUpdates: {
        __args: {
          first: 25,
          filter,
        },
        nodes: {
          id: true,
          body: true,
          url: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
          health: true,
          initiative: {
            id: true,
            name: true,
          },
          user: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
  };
  const query = jsonToGraphQLQuery(jsonQuery);
  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = (response.json as InitiativeUpdatesResponse).data;
  return data.initiativeUpdates.nodes;
};

const operationBase = {
  inputFields: [
    {
      required: false,
      label: "Creator",
      key: "creatorId",
      helpText: "Only trigger on initiative updates added by this user.",
      dynamic: "user.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Initiative",
      key: "initiativeId",
      helpText: "Only trigger on initiative updates tied to this initiative.",
      dynamic: "initiative.id.name",
      altersDynamicFields: true,
    },
  ],
  type: "hook",
  perform: getWebhookData,
  performUnsubscribe: unsubscribeHook,
  performList: getInitiativeUpdateList(),
  sample,
};

export const newInitiativeUpdateInstant = {
  noun: "Initiative Update",
  key: "newInitiativeUpdateInstant",
  display: {
    label: "New Initiative Update",
    description: "Triggers when a new initiative update is created.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("create"),
  },
};

export const updatedInitiativeUpdateInstant = {
  noun: "Initiative Update",
  key: "updatedInitiativeUpdateInstant",
  display: {
    label: "Updated Initiative Update",
    description: "Triggers when an initiative update is updated.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("update"),
  },
};
