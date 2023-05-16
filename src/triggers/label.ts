import { ZObject, Bundle } from "zapier-platform-core";

type LabelResponse = {
  id: string;
  name: string;
  parent?: LabelResponse;
}

type LabelsResponse ={
  data: {
    team: {
      labels: {
        nodes: LabelResponse[];
      };
    };
  };
}

const getLabelList = async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.team_id) {
    throw new z.errors.HaltedError(`Please select the team first`);
  }
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;

  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query ListLabels($teamId: String!, $after: String) {
        team(id: $teamId) {
          labels(first: 50, after: $after) {
            nodes {
              id
              name
              parent {
                id
                name
              }
            }
          }
        }
      }`,
      variables: {
        teamId: bundle.inputData.team_id,
        after: cursor
      },
    },
    method: "POST",
  });

  const data = (response.json as LabelsResponse).data;
  const labels = data.team.labels.nodes;

  const nextCursor = labels?.[labels.length - 1]?.id
  if (nextCursor) {
    await z.cursor.set(nextCursor);
  }

  return labels.map((label) => ({
    id: label.id,
    name: label.parent ? `${label.parent.name} → ${label.name}` : label.name,
  }));
};

export const label = {
  key: "label",
  noun: "Label",

  display: {
    label: "Get issue label",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of issue labels in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getLabelList,
    canPaginate: true,
  },
};
