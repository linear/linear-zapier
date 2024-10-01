import { pick } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/issueComment.json";
import { getWebhookData, unsubscribeHook } from "../handleWebhook";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";
import { fetchFromLinear } from "../fetchFromLinear";

interface ProjectUpdate {
  id: string;
  body: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  health: string;
  project: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProjectUpdatesResponse {
  data: {
    projectUpdates: {
      nodes: ProjectUpdate[];
    };
  };
}

type EventType = "create" | "update";

const subscribeHook = (eventType: EventType) => async (z: ZObject, bundle: Bundle) => {
  const data = {
    url: bundle.targetUrl,
    inputData:
      bundle.inputData && Object.keys(bundle.inputData).length > 0
        ? pick(bundle.inputData, ["creatorId", "projectId", "teamId"])
        : undefined,
  };

  const webhookType = eventType === "create" ? "createProjectUpdate" : "updateProjectUpdate";
  return z
    .request({
      url: `https://client-api.linear.app/connect/zapier/subscribe/${webhookType}`,
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

const getProjectUpdateList = () => async (z: ZObject, bundle: Bundle) => {
  const variables: Record<string, string> = {};
  const variableSchema: Record<string, string> = {};
  const filters: unknown[] = [];
  if (bundle.inputData.creatorId) {
    variableSchema.creatorId = "ID";
    variables.creatorId = bundle.inputData.creatorId;
    filters.push({ user: { id: { eq: new VariableType("creatorId") } } });
  }
  if (bundle.inputData.teamId) {
    variableSchema.teamId = "ID";
    variables.teamId = bundle.inputData.teamId;
    filters.push({ project: { accessibleTeams: { id: { eq: new VariableType("teamId") } } } });
  }
  if (bundle.inputData.projectId) {
    variableSchema.projectId = "ID";
    variables.projectId = bundle.inputData.projectId;
    filters.push({ project: { id: { eq: new VariableType("projectId") } } });
  }
  const filter = { and: filters };

  const jsonQuery = {
    query: {
      __variables: variableSchema,
      projectUpdates: {
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
          project: {
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
  const data = (response.json as ProjectUpdatesResponse).data;
  return data.projectUpdates.nodes;
};

const operationBase = {
  inputFields: [
    {
      required: false,
      label: "Creator",
      key: "creatorId",
      helpText: "Only trigger on project updates added by this user.",
      dynamic: "user.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Project ID",
      key: "projectId",
      helpText: "Only trigger on project updates tied to this project.",
    },
    {
      required: false,
      label: "Team",
      key: "teamId",
      helpText: "Only trigger on project updates created in projects tied to this team.",
      dynamic: "team.id.name",
      altersDynamicFields: true,
    },
  ],
  type: "hook",
  perform: getWebhookData,
  performUnsubscribe: unsubscribeHook,
  performList: getProjectUpdateList(),
  sample,
};

export const newProjectUpdateInstant = {
  noun: "Project Update",
  key: "newProjectUpdateInstant",
  display: {
    label: "New Project Update",
    description: "Triggers when a new project update is created.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("create"),
  },
};

export const updatedProjectUpdateInstant = {
  noun: "Project Update",
  key: "updatedProjectUpdateInstant",
  display: {
    label: "Updated Project Update",
    description: "Triggers when a project update is updated.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("update"),
  },
};
