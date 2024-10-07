import { ZObject, Bundle } from "zapier-platform-core";

interface InitiativesResponse {
  data: {
    initiatives: {
      nodes: {
        id: string;
        name: string;
      }[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

const getInitiativesList = async (z: ZObject, bundle: Bundle) => {
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
        query Initiatives($after: String) {
          initiatives(
            first: 50
            after: $after
          ) {
            nodes {
              id
              name
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }`,
      variables: {
        after: cursor,
      },
    },
    method: "POST",
  });

  const data = (response.json as InitiativesResponse).data;
  const initiatives = data.initiatives.nodes;

  // Set cursor for pagination
  if (data.initiatives.pageInfo.hasNextPage) {
    await z.cursor.set(data.initiatives.pageInfo.endCursor);
  }

  return initiatives;
};

export const initiative = {
  key: "initiative",
  noun: "Initiative",
  display: {
    label: "Get initiative",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of initiatives in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getInitiativesList,
    canPaginate: true,
  },
};
