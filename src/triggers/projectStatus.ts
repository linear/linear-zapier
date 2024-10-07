import { ZObject, Bundle } from "zapier-platform-core";

interface ProjectStatusesResponse {
  data: {
    organization: {
      projectStatuses: {
        id: string;
        name: string;
      }[];
    };
  };
}

const getStatusList = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: "https://api.linear.app/graphql",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: bundle.authData.api_key,
    },
    body: {
      query: `
      query ProjectStatuses {
        organization {
          projectStatuses {
            id
            name
          }
        }
      }`,
    },
    method: "POST",
  });
  const data = (response.json as ProjectStatusesResponse).data;
  return data.organization.projectStatuses;
};

export const projectStatus = {
  key: "projectStatus",
  noun: "Project Status",
  display: {
    label: "Get project status",
    hidden: true,
    description:
      "The only purpose of this trigger is to populate the dropdown list of project statuses in the UI, thus, it's hidden.",
  },
  operation: {
    perform: getStatusList,
  },
};
