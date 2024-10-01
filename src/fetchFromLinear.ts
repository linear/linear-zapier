import { Bundle, ZObject } from "zapier-platform-core";

/**
 * Performs a query against the Linear GraphQL API and returns the response.
 */
export const fetchFromLinear = async (z: ZObject, bundle: Bundle, query: string, variables: Record<string, string>) => {
  return await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query,
      variables,
    },
    method: "POST",
  });
};
