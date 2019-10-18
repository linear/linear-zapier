import { ZObject, Bundle } from "zapier-platform-core";

interface UsersResponse {
  data: {
    users: {
      name: string;
      displayName: string;
      id: string;
      active: boolean;
    }[];
  };
}

const getUserList = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query {
        users {
          name
          displayName
          id
          active
        }
      }
    `,
    },
    method: "POST",
  });
  const users = (response.json as UsersResponse).data.users.filter(user => user.active === true);
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
  },
};
