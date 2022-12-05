import { ZObject, Bundle } from "zapier-platform-core";

enum EstimationType {
  /** Don't use estimates. */
  notUsed = "notUsed",

  /** 1, 2, 4, 8, 16. */
  exponential = "exponential",

  /** 1, 2, 3, 5, 8. */
  fibonacci = "fibonacci",

  /** 1, 2, 3, 4, 5. */
  linear = "linear",

  /** XS, S, M, L, XL. */
  tShirt = "tShirt",
}

type TeamResponse ={
  data: {
    team: {
      issueEstimationAllowZero: boolean;
      issueEstimationExtended: boolean;
      issueEstimationType: EstimationType;
    };
  };
}

const optionsForType = (type: EstimationType, allowZero: boolean, extended: boolean): {id: number, label: string}[] => {
  const result = [];
  if (allowZero) {
    result.push(type === EstimationType.tShirt ? {id: 0, label: '-'} : {id: 0, label: '0 Points'})
  }

  switch (type) {
    case EstimationType.notUsed:
      return [];
    case EstimationType.exponential:
      return result.concat(
        [
          {id: 1, label: '1 Point'},
          {id: 2, label: '2 Points'},
          {id: 4, label: '4 Points'},
          {id: 8, label: '8 Points'},
          { id: 16, label: '16 Points'}
        ]).concat(
          extended ? [
            { id: 32, label: '32 Points'},
            { id: 64, label: '64 Points'}
          ] : []
        );
    case EstimationType.fibonacci:
      return result.concat(
        [
          {id: 1, label: '1 Point'},
          {id: 2, label: '2 Points'},
          {id: 3, label: '3 Points'},
          {id: 5, label: '5 Points'},
          {id: 8, label: '8 Points'},
        ]).concat(
          extended ? [
            { id: 13, label: '13 Points'},
            { id: 21, label: '21 Points'},
          ] : []
        );
    case EstimationType.linear:
      return result.concat(
        [
          {id: 1, label: '1 Point'},
          {id: 2, label: '2 Points'},
          {id: 3, label: '3 Points'},
          {id: 4, label: '4 Points'},
          {id: 5, label: '5 Points'},
        ]).concat(
          extended ? [
            {id: 6, label: '6 Points'},
            {id: 7, label: '7 Points'},
          ] : []
        );
    case EstimationType.tShirt:
      return result.concat(
        [
          {id: 1, label: 'XS'},
          {id: 2, label: 'S'},
          {id: 3, label: 'M'},
          {id: 5, label: 'L'},
          {id: 8, label: 'XL'},
        ]).concat(
          extended ? [
            { id: 13, label: 'XXL'},
            { id: 21, label: 'XXXL'},
          ] : []
        );
    default:
      return [];
  }
}

const getEstimateOptions = async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.team_id) {
    throw new z.errors.HaltedError(`Please select the team first`);
  }
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query ($teamId: String!) {
        team(id: $teamId) {
          issueEstimationAllowZero
          issueEstimationExtended
          issueEstimationType
        }
      }`,
      variables: {
        teamId: bundle.inputData.team_id,
      },
    },
    method: "POST",
  });

  const data = (response.json as TeamResponse).data;
  return optionsForType(data.team.issueEstimationType, data.team.issueEstimationAllowZero, data.team.issueEstimationExtended);
};

export const estimate = {
  key: "estimate",
  noun: "Estimate",

  display: {
    label: "Get issue estimate options",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of issue estimates in the UI, thus, it's hidden.",
  },

  operation: {
    perform: getEstimateOptions,
    canPaginate: false,
  },
};
