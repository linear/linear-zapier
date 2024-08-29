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
    url: "https://linear-dev-intercom.ngrok.io/graphql",
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
  type: "oauth2",

  test: testAuth,

  connectionLabel: (z: ZObject, bundle: Bundle) => {
    const data = bundle.inputData.data;
    return `${data.user.name} (${data.user.email})`;
  },
  // you can provide additional fields for inclusion in authData
  oauth2Config: {
    // "authorizeUrl" could also be a function returning a string url
    authorizeUrl: {
      method: "GET",
      url: "https://local.linear.dev:8080/oauth/authorize",
      params: {
        client_id: "{{process.env.CLIENT_ID}}",
        state: "{{bundle.inputData.state}}",
        redirect_uri: "{{bundle.inputData.redirect_uri}}",
        response_type: "code",
        scope: "read,write",
        actor: "application",
      },
    },
    // Zapier expects a response providing {access_token: 'abcd'}
    // "getAccessToken" could also be a function returning an object
    getAccessToken: {
      method: "POST",
      url: "https://linear-dev-intercom.ngrok.io/oauth/token",
      body: {
        code: "{{bundle.inputData.code}}",
        client_id: "{{process.env.CLIENT_ID}}",
        client_secret: "{{process.env.CLIENT_SECRET}}",
        redirect_uri: "{{bundle.inputData.redirect_uri}}",
        grant_type: "authorization_code",
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    scope: "read,write",
  },

  customConfig: {},
};

export const addBearerHeader = (request: Request, z: ZObject, bundle: Bundle) => {
  if (bundle.authData && bundle.authData.access_token) {
    (request.headers as any)["Authorization"] = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};
