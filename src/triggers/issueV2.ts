import { omitBy, pick } from "lodash";
import { ZObject, Bundle } from "zapier-platform-core";
import sample from "../samples/issue.json";
import { unsubscribeHook } from "../handleWebhook";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";
import { fetchFromLinear } from "../fetchFromLinear";

interface Issue {
  id: string;
  identifier: string;
  url: string;
  title: string;
  description: string;
  priority: string;
  estimate?: number;
  dueDate?: Date;
  slaBreachesAt?: Date;
  slaStartedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    name: string;
  };
  projectMilestone?: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  state: {
    id: string;
    name: string;
    type: string;
  };
  parent?: {
    id: string;
    identifier: string;
    url: string;
    title: string;
  };
}

interface TeamIssuesResponse {
  data: {
    team: {
      issues: {
        nodes: Issue[];
      };
    };
  };
}

const subscribeHook = (eventType: "create" | "update") => async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.team_id) {
    throw new z.errors.HaltedError("You must select a team");
  }

  const inputData =
    bundle.inputData && Object.keys(bundle.inputData).length > 0
      ? omitBy(
          {
            ...pick(bundle.inputData, [
              "teamId",
              "statusId",
              "creatorId",
              "assigneeId",
              "labelId",
              "projectId",
              "projectMilestoneId",
            ]),
            priority: bundle.inputData.priority ? Number(bundle.inputData.priority) : undefined,
          },
          (v) => v === undefined
        )
      : undefined;

  const data = {
    url: bundle.targetUrl,
    inputData,
  };

  const webhookType = eventType === "create" ? "createIssue" : "updateIssue";
  return z
    .request({
      url: `https://client-api.linear.app/connect/zapier/subscribe/${webhookType}`,
      method: "POST",
      body: data,
    })
    .then((response) => response.data);
};

const getIssueList = () => async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.teamId) {
    throw new z.errors.HaltedError("You must select a team");
  }

  const variables: Record<string, string | Number> = {};
  const variableSchema: Record<string, string> = {};

  variableSchema.teamId = "String!";
  variables.teamId = bundle.inputData.teamId;

  const filters: unknown[] = [];
  if (bundle.inputData.priority) {
    variableSchema.priority = "Float";
    variables.priority = Number(bundle.inputData.priority);
    filters.push({ priority: { eq: new VariableType("priority") } });
  }
  if (bundle.inputData.statusId) {
    variableSchema.statusId = "ID";
    variables.statusId = bundle.inputData.statusId;
    filters.push({ state: { id: { eq: new VariableType("statusId") } } });
  }
  if (bundle.inputData.creatorId) {
    variableSchema.creatorId = "ID";
    variables.creatorId = bundle.inputData.creatorId;
    filters.push({ creator: { id: { eq: new VariableType("creatorId") } } });
  }
  if (bundle.inputData.assigneeId) {
    variableSchema.assigneeId = "ID";
    variables.assigneeId = bundle.inputData.assigneeId;
    filters.push({ assignee: { id: { eq: new VariableType("assigneeId") } } });
  }
  if (bundle.inputData.projectId) {
    variableSchema.projectId = "ID";
    variables.projectId = bundle.inputData.projectId;
    filters.push({ project: { id: { eq: new VariableType("projectId") } } });
  }
  if (bundle.inputData.projectMilestoneId) {
    variableSchema.projectMilestoneId = "ID";
    variables.projectMilestoneId = bundle.inputData.projectMilestoneId;
    filters.push({ projectMilestone: { id: { eq: new VariableType("projectMilestoneId") } } });
  }
  if (bundle.inputData.labelId) {
    variableSchema.labelId = "ID";
    variables.labelId = bundle.inputData.labelId;
    filters.push({ labels: { id: { eq: new VariableType("labelId") } } });
  }
  const filter = { and: filters };

  const jsonQuery = {
    query: {
      __variables: variableSchema,
      team: {
        __args: {
          id: new VariableType("teamId"),
        },
        issues: {
          __args: {
            first: 10,
            filter,
          },
          nodes: {
            id: true,
            identifier: true,
            url: true,
            title: true,
            description: true,
            priority: true,
            estimate: true,
            dueDate: true,
            slaBreachesAt: true,
            slaStartedAt: true,
            createdAt: true,
            updatedAt: true,
            project: {
              id: true,
              name: true,
            },
            projectMilestone: {
              id: true,
              name: true,
            },
            creator: {
              id: true,
              name: true,
              email: true,
            },
            assignee: {
              id: true,
              name: true,
              email: true,
            },
            state: {
              id: true,
              name: true,
              type: true,
            },
            parent: {
              id: true,
              identifier: true,
              url: true,
              title: true,
            },
          },
        },
      },
    },
  };
  const query = jsonToGraphQLQuery(jsonQuery);
  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = (response.json as TeamIssuesResponse).data;
  return data.team.issues.nodes;
};

const getWebhookDataForIssue = (z: ZObject, bundle: Bundle) => {
  const entity = {
    ...bundle.cleanedRequest.data,
    querystring: undefined,
  };

  // Webhooks send this over as `milestone`, but the API uses `projectMilestone` and users model their Zaps off the API response to start
  if (entity.milestone) {
    entity.projectMilestone = entity.milestone;
    delete entity.milestone;
  }

  return [entity];
};

const operationBase = {
  inputFields: [
    {
      required: true,
      label: "Team",
      key: "teamId",
      helpText: "The team for the issue.",
      dynamic: "team.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Status",
      key: "statusId",
      helpText: "The issue status.",
      dynamic: "status.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Creator",
      key: "creatorId",
      helpText: "The user who created this issue.",
      dynamic: "user.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Assignee",
      key: "assigneeId",
      helpText: "The assignee of this issue.",
      dynamic: "user.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Priority",
      key: "priority",
      helpText: "The priority of the issue.",
      choices: [
        { value: "0", sample: "0", label: "No priority" },
        { value: "1", sample: "1", label: "Urgent" },
        { value: "2", sample: "2", label: "High" },
        { value: "3", sample: "3", label: "Medium" },
        { value: "4", sample: "4", label: "Low" },
      ],
    },
    {
      required: false,
      label: "Label",
      key: "labelId",
      helpText: "Label which was assigned to the issue.",
      dynamic: "label.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Project",
      key: "projectId",
      helpText: "Issue's project.",
      dynamic: "project.id.name",
      altersDynamicFields: true,
    },
    {
      required: false,
      label: "Project Milestone",
      key: "projectMilestoneId",
      helpText: "Issue's project milestone.",
      dynamic: "project_milestone.id.name",
      altersDynamicFields: true,
    },
  ],
  type: "hook",
  perform: getWebhookDataForIssue,
  performUnsubscribe: unsubscribeHook,
  performList: getIssueList(),
  sample,
};

export const newIssueInstant = {
  noun: "Issue",
  key: "newIssueInstant",
  display: {
    label: "New Issue",
    description: "Triggers when a new issue is created.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("create"),
  },
};

export const updatedIssueInstant = {
  noun: "Issue",
  key: "updatedIssueInstant",
  display: {
    label: "Updated Issue",
    description: "Triggers when an issue is updated.",
  },
  operation: {
    ...operationBase,
    performSubscribe: subscribeHook("update"),
  },
};
