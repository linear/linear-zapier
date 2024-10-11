import { Bundle, ZObject } from "zapier-platform-core";

/**
 * Performs a query against the Linear GraphQL API and returns the response.
 */
export const fetchFromLinear = async (
  z: ZObject,
  bundle: Bundle,
  query: string,
  variables: Record<string, string | Number>
) => {
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

/**
 * Retrieves the team ID for an issue from Linear.
 *
 * @param z Zapier object
 * @param bundle Zapier bundle
 * @param issueId Linear issue ID
 * @returns The Linear team ID for the issue
 */
export const getIssueTeamId = async (z: ZObject, bundle: Bundle, issueId: string) => {
  const issueQuery = `
    query ZapierIssue($id: String!) {
      issue(id: $id) {
        team {
          id
        }
      }
    }
  `;
  const response = await fetchFromLinear(z, bundle, issueQuery, { id: issueId });
  const data = response.json as IssueResponse;
  return data.data.issue.team.id;
};

interface IssueResponse {
  data: { issue: { team: { id: string } } };
}
