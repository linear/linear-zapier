import { ZObject, Bundle } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";
import { omitBy } from "lodash";

interface TemplateResponse {
  id: string;
  name: string;
}

interface TemplatesResponseTeam {
  data: {
    team: {
      templates: {
        nodes: TemplateResponse[];
      };
    };
  };
}

interface TemplatesResponseWorkspace {
  data: {
    organization: {
      templates: {
        nodes: TemplateResponse[];
      };
    };
  };
}

const getTemplateList = async (z: ZObject, bundle: Bundle) => {
  const teamId = bundle.inputData.teamId || bundle.inputData.team_id;
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;
  // We fetch team and workspace templates if a team ID has been specified already, and only workspace templates if not
  const query = teamId
    ? `
    query ZapierListTemplates($teamId: String!, $after: String) {
      team(id: $teamId) {
        templates(first: 50, after: $after, filter: { type: { eq: "issue" } }) {
          nodes {
            id
            name
          }
        }
      }
    }`
    : `
    query ZapierListTemplates($after: String) {
      organization {
        templates(first: 50, after: $after, filter: { type: { eq: "issue" } }) {
          nodes {
            id
            name
          }
        }
      }
    }`;
  const variables = omitBy({ teamId, after: cursor }, (v) => v === undefined);

  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = (response.json as TemplatesResponseTeam | TemplatesResponseWorkspace).data;
  const templates = "team" in data ? data.team.templates.nodes : data.organization.templates.nodes;

  const nextCursor = templates?.[templates.length - 1]?.id;
  if (nextCursor) {
    await z.cursor.set(nextCursor);
  }

  return templates;
};

export const issueTemplates = {
  key: "issueTemplates",
  noun: "Issue Templates",

  display: {
    label: "Get issue templates",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of issue templates in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getTemplateList,
    canPaginate: true,
  },
};
