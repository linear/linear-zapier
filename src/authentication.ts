import { ZObject, Bundle } from "zapier-platform-core";

interface AuthResponse {
  errors?: {
    message: string;
    extensions: {
      type: string;
      userError: boolean;
      userPresentableMessage: string;
    };
  }[];
}

const testAuth = async (z: ZObject, bundle: Bundle) => {
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
          user(id: "me") {
            name
            email
          }
        }
      `,
    },
    method: "POST",
  });

  const data = response.json as AuthResponse;

  if (data.errors) {
    throw new Error("Invalid API key.");
  }

  return response.json;
};

export const authentication = {
  type: "custom",

  test: testAuth,

  connectionLabel: (z: ZObject, bundle: Bundle) => {
    const data = bundle.inputData.data;
    return `${data.user.name} (${data.user.email})`;
  },

  fields: [
    {
      required: true,
      label: "API Key",
      helpText: "Enter the value for one of your API Keys that you have created in https://linear.app/settings/api",
      key: "api_key",
      type: "password",
    },
  ],

  customConfig: {},
};
