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
    };
  };
}

const getUserList = async (z: ZObject, bundle: Bundle) => {
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
        query ListUsers($after: String) {
          users(first: 50, after: $after, filter: {active: {eq: true}}) {
            nodes {
              name
              displayName
              id
            }
          }
        }
      `,
      variables: {
        after: cursor
      },
    },
    method: "POST",
  });
  const users = (response.json as UsersResponse).data.users.nodes;

  // Set cursor for pagination
  const nextCursor = users?.[users.length - 1]?.id
  if (nextCursor) {
    await z.cursor.set(nextCursor);
  }

  return users.map(user => ({
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
