import { ZObject, Bundle } from "zapier-platform-core";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";
import { fetchFromLinear, LinearGraphQLVariables } from "../fetchFromLinear";
import { IssueCommon } from "../triggers/issue";
import sample from "../samples/issue.json";

interface IssueByNameInput {
  name: string;
  teamId?: string;
}

interface IssueByNameResponse {
  data: {
    issues: {
      nodes: IssueByNameApi[];
    };
  };
}

interface IssueByNameApi extends IssueCommon {
  labels?: {
    nodes: {
      id: string;
      color: string;
      name: string;
      parent?: {
        id: string;
      };
    }[];
  };
}

const issueSelectionSet = {
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
  labels: {
    nodes: {
      id: true,
      color: true,
      name: true,
      parent: {
        id: true,
      },
    },
  },
  attachments: {
    nodes: {
      id: true,
      title: true,
      subtitle: true,
      url: true,
      source: true,
      sourceType: true,
      metadata: true,
    },
  },
};

/**
 * Finds issues by matching issue titles with a case-insensitive partial search.
 */
const getIssuesByName = async (z: ZObject, bundle: Bundle<IssueByNameInput>) => {
  const variables: LinearGraphQLVariables = {
    issueName: bundle.inputData.name,
  };
  const variableSchema: Record<string, string> = {
    issueName: "String!",
  };

  const filters: unknown[] = [{ title: { containsIgnoreCase: new VariableType("issueName") } }];

  if (bundle.inputData.teamId) {
    variables.teamId = bundle.inputData.teamId;
    variableSchema.teamId = "ID";
    filters.push({ team: { id: { eq: new VariableType("teamId") } } });
  }

  const query = jsonToGraphQLQuery({
    query: {
      __variables: variableSchema,
      issues: {
        __args: {
          first: 10,
          filter: {
            and: filters,
          },
        },
        nodes: issueSelectionSet,
      },
    },
  });

  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = (response.json as IssueByNameResponse).data;
  return data.issues.nodes;
};

export const findIssueByName = {
  key: "issues_by_name",
  noun: "Issues",

  display: {
    label: "Find Issues by Name",
    hidden: false,
    description: "Find issues by name",
  },

  operation: {
    perform: getIssuesByName,
    inputFields: [
      {
        key: "name",
        required: true,
        label: "Issue Name",
        helpText: "Case-insensitive partial match against issue title.",
      },
      {
        key: "teamId",
        required: false,
        label: "Team",
        helpText: "Optionally limit results to a specific team.",
        dynamic: "team.id.name",
      },
    ],
    sample,
  },
};
