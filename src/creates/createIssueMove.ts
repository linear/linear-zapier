import { Bundle, ZObject } from "zapier-platform-core";

interface createIssueMoveRequestResponse {
    data?: { issueUpdate: { success: boolean } };
    errors?: {
      message: string;
      extensions?: {
        userPresentableMessage?: string;
      };
    }[];
  }

  interface teamStatesRequestResponse {
    data?: { team: { states: { nodes: { name: String, type: String, id: String}[] } } },
    errors?: {
      message: string;
      extensions?: {
        userPresentableMessage?: string;
      };
    }[];
  }


  const getStateID = async (z: ZObject, bundle: Bundle) => {
    const variables = {
        stateName: bundle.inputData.state,
        teamId: bundle.inputData.team,
      };

    const query =`
        query team(
            $teamId: String!,
            $stateName: String!
        ) {
          team(id: $teamId) {
            states(first:1, filter: { name: { eq: $stateName } } ) {
                nodes {
                    name
                    id
                    type
                }
            }
          }
        }
    `

    const response = await z.request({
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

    const data = response.json as teamStatesRequestResponse
    if (data)
        return data.data?.team.states.nodes[0].id
    throw new z.errors.Error(`Failed to get team states ${JSON.stringify(data)}`, "", 400);
  }

  const createIssueMoveRequest = async (z: ZObject, bundle: Bundle) => {
    const variables = {
      issueId: bundle.inputData.issue,
      stateId: await getStateID(z, bundle)
    };

    
    const query = `
      mutation issueUpdate(
        $issueId: String!,
        $stateId: String!
      ) {
        issueUpdate(
          id: $issueId,
          input: {
            stateId: $stateId
          }) {
          success
        }
      }`;

      z.console.log(JSON.stringify(query));
      const response = await z.request({
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

      const data = response.json as createIssueMoveRequestResponse;
      z.console.log(JSON.stringify(data));

      if (data.errors && data.errors.length) {
        const error = data.errors[0];
        throw new z.errors.Error(
          (error.extensions && error.extensions.userPresentableMessage) || error.message,
          "invalid_input",
          400
        );
      }

      if (data.data &&  data.data.issueUpdate && data.data.issueUpdate.success) {
        return data.data.issueUpdate
      } else {
        const error = data.errors ? data.errors[0].message : "Something went wrong2";
        throw new z.errors.Error(`Failed to create an attachment ${JSON.stringify(data)}`, "", 400);
      }
    };
  

    export const createIssueMove = {
      key: "create_issue_move",
    
      display: {
        hidden: false,
        important: true,
        description: "Move an existing issue to a new state.",
        label: "Move an existing issue to a new state.",
      },
    
      noun: "CreateIssueMove",
    
      operation: {
        perform: createIssueMoveRequest,
    
        inputFields: [
          {
            required: true,
            label: "IssueId",
            helpText: "The ID of the issue. Both UUID and application ID formats are accepted.",
            key: "issue",
          },
          {
            required: true,
            label: "StateName",
            helpText: "The name of the state",
            key: "state",
          },
          {
            required: true,
            label: "TeamId",
            helpText: "The name of the team",
            key: "team",
          },
        ],
        sample: { data: { success: true } },
      },
    };
    