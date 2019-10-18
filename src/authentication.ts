import { ZObject, Bundle } from "zapier-platform-core";

export const authentication = {
  type: "custom",

  test: {
    body: { query: 'query { user(id: "me") { name email }}' },
    url: "https://api.linear.app/graphql",
    removeMissingValuesFrom: {},
    headers: { authorization: "{{bundle.authData.api_key}}" },
    params: {},
    method: "POST",
  },

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
