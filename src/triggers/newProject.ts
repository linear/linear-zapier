import { omit, omitBy, pick } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/project.json";
import { getWebhookData, unsubscribeHook } from "../handleWebhook";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";
import { fetchFromLinear } from "../fetchFromLinear";

interface IdAndName {
  id: string;
  name: string;
}

interface ProjectCommon {
  id: string;
  url: string;
  name: string;
  description: string;
  content: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  targetDate?: Date;
  status: {
    id: string;
    name: string;
    type: string;
  };
}

export interface ProjectApi extends ProjectCommon {
  teams: {
    nodes: IdAndName[];
  };
  initiatives: {
    nodes: IdAndName[];
  };
  projectMilestones: {
    nodes: IdAndName[];
  };
}

interface ProjectsResponse {
  data: {
    projects: {
      nodes: ProjectApi[];
    };
  };
}

interface ProjectWebhook extends ProjectCommon {
  teamIds: string[];
  milestones: IdAndName[];
  initiatives: IdAndName[];
}

const subscribeHook = (eventType: "create" | "update") => async (z: ZObject, bundle: Bundle) => {
  const inputData =
    bundle.inputData && Object.keys(bundle.inputData).length > 0
      ? omitBy(
          {
            ...pick(bundle.inputData, ["teamId", "statusId", "leadId", "initiativeId"]),
          },
          (v) => v === undefined
        )
      : undefined;

  const data = {
    url: bundle.targetUrl,
    inputData,
  };
  const webhookType = eventType === "create" ? "createProject" : "updateProject";

  return z
    .request({
      url: `https://client-api.linear.app/connect/zapier/subscribe/${webhookType}`,
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

const getProjectList =
  () =>
  async (z: ZObject, bundle: Bundle): Promise<ProjectWebhook[]> => {
    const variables: Record<string, string> = {};
    const variableSchema: Record<string, string> = {};
    const filters: unknown[] = [];
    if (bundle.inputData.statusId) {
      variableSchema.statusId = "ID";
      variables.statusId = bundle.inputData.statusId;
      filters.push({ status: { id: { eq: new VariableType("statusId") } } });
    }
    if (bundle.inputData.leadId) {
      variableSchema.leadId = "ID";
      variables.leadId = bundle.inputData.leadId;
      filters.push({ lead: { id: { eq: new VariableType("leadId") } } });
    }
    if (bundle.inputData.teamId) {
      variableSchema.teamId = "ID!";
      variables.teamId = bundle.inputData.teamId;
      filters.push({ accessibleTeams: { and: [{ id: { in: [new VariableType("teamId")] } }] } });
    }
    if (bundle.inputData.initiativeId) {
      variableSchema.initiativeId = "ID!";
      variables.initiativeId = bundle.inputData.initiativeId;
      filters.push({ initiatives: { and: [{ id: { in: [new VariableType("initiativeId")] } }] } });
    }
    const filter = { and: filters };

    const jsonQuery = {
      query: {
        __variables: variableSchema,
        projects: {
          __args: {
            first: 25,
            filter,
          },
          nodes: {
            id: true,
            url: true,
            name: true,
            description: true,
            content: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
            startDate: true,
            targetDate: true,
            status: {
              id: true,
              name: true,
              type: true,
            },
            teams: {
              nodes: {
                id: true,
                name: true,
              },
            },
            initiatives: {
              nodes: {
                id: true,
                name: true,
              },
            },
            projectMilestones: {
              nodes: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    };
    const query = jsonToGraphQLQuery(jsonQuery);
    const response = await fetchFromLinear(z, bundle, query, variables);
    const data = (response.json as ProjectsResponse).data;
    const projectsRaw = data.projects.nodes;
    // We need to map the API schema to the webhook schema
    return projectsRaw.map((projectRaw) =>
      omit(
        {
          ...projectRaw,
          teamIds: projectRaw.teams.nodes.map((team) => team.id),
          milestones: projectRaw.projectMilestones.nodes,
          initiatives: projectRaw.initiatives.nodes,
        },
        ["teams", "projectMilestones"]
      )
    );
  };

const operationBase = {
  inputFields: [
    {
      required: false,
      label: "Team",
      key: "teamId",
      helpText: "The team associated with the project.",
      dynamic: "team.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Status",
      key: "statusId",
      helpText: "The project status.",
      dynamic: "projectStatus.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Lead",
      key: "leadId",
      helpText: "The user who is the lead of the project.",
      dynamic: "user.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Initiative",
      key: "initiativeId",
      helpText: "The initiative this project belongs to.",
      dynamic: "initiative.id.name",
      altersDynamicFields: true,
    },
  ],
  type: "hook",
  perform: getWebhookData,
  performUnsubscribe: unsubscribeHook,
  performList: getProjectList(),
  sample,
};

export const newProjectInstant = {
  noun: "Project",
  key: "newProjectInstant",
  display: {
    label: "New Project",
    description: "Triggers when a new project is created.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("create"),
  },
};

export const updatedProjectInstant = {
  noun: "Project",
  key: "updatedProjectInstant",
  display: {
    label: "Updated Project",
    description: "Triggers when a project is updated.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("update"),
  },
};
