import { ZObject, Bundle } from "zapier-platform-core";

interface UsersResponse {
  data: {
    users: {
      nodes: {
        name: string;
        displayName: string;
        id: string;
        active: boolean;
      }[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

const getUserList = async (z: ZObject, bundle: Bundle) => {
  const cursor = bundle.meta.page ? await z.cursor.get() : undefined;

  const response = await z.request({
    url: "https://local.linear.dev:8090/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
        query ZapierListUsers($after: String) {
          users(
            first: 50
            after: $after
            filter: { active: { eq: true } }
          ) {
            nodes {
              name
              displayName
              id
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      variables: {
        after: cursor,
      },
    },
    method: "POST",
  });

  const data = (response.json as UsersResponse).data;
  const users = data.users.nodes;

  // Set cursor for pagination
  if (data.users.pageInfo.hasNextPage) {
    await z.cursor.set(data.users.pageInfo.endCursor);
  }

  return users.map((user) => ({
    name: `${user.name} (${user.displayName})`,
    id: user.id,
  }));
};

export const user = {
  key: "user",
  noun: "User",

  display: {
    label: "Get user",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of users in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getUserList,
    canPaginate: true,
  },
};
