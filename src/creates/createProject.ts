import { Bundle, ZObject } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";
import { omitBy } from "lodash";

interface ProjectCreateResponse {
  data?: { projectCreate: { project: { id: string; url: string; name: string }; success: boolean } };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
}

const createProjectRequest = async (z: ZObject, bundle: Bundle) => {
  const teamIds = bundle.inputData.teams || [];
  if (teamIds.length === 0) {
    throw new z.errors.HaltedError("You must select at least one team to add to the project");
  }
  const variables = omitBy(
    {
      name: bundle.inputData.name,
      description: bundle.inputData.description || "",
      statusId: bundle.inputData.statusId,
      teamIds,
      memberIds: bundle.inputData.members || [],
      leadId: bundle.inputData.lead,
      priority: bundle.inputData.priority ? Number(bundle.inputData.priority) : undefined,
    },
    (v) => v === undefined
  );
  const query = `
      mutation ZapierProjectCreate(
        $name: String!,
        $description: String!,
        $statusId: String,
        $teamIds: [String!]!,
        $memberIds: [String!],
        $leadId: String,
        $priority: Int
      ) {
        projectCreate(input: {
          name: $name,
          description: $description,
          statusId: $statusId,
          teamIds: $teamIds,
          memberIds: $memberIds,
          leadId: $leadId,
          priority: $priority
        }) {
          project {
            id
            url
            name
          }
          success
        }
      }`;

  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = response.json as ProjectCreateResponse;

  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.projectCreate && data.data.projectCreate.success) {
    return data.data.projectCreate.project;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong";
    throw new z.errors.Error("Failed to create a project", error, 400);
  }
};

export const createProject = {
  key: "createProject",
  display: {
    hidden: false,
    description: "Create a new project in Linear",
    label: "Create Project",
  },
  noun: "Project",
  operation: {
    perform: createProjectRequest,
    inputFields: [
      {
        required: true,
        label: "Name",
        helpText: "The name of the project",
        key: "name",
      },
      {
        required: false,
        label: "Summary",
        helpText: "A short summary of the project",
        key: "description",
        type: "text",
      },
      {
        required: false,
        label: "Status",
        key: "statusId",
        helpText: "The status of the project",
        dynamic: "projectStatus.id.name",
        altersDynamicFields: true,
      },
      {
        required: true,
        label: "Teams",
        helpText: "The teams to add to this project",
        key: "teams",
        dynamic: "team.id.name",
        list: true,
      },
      {
        required: false,
        label: "Members",
        helpText: "The users to add as project members",
        key: "members",
        dynamic: "user.id.name",
        list: true,
      },
      {
        required: false,
        label: "Lead",
        helpText: "The user to assign as the project lead",
        key: "lead",
        dynamic: "user.id.name",
      },
      {
        required: false,
        label: "Priority",
        helpText: "The priority of the project",
        key: "priority",
        choices: [
          { value: "0", sample: "0", label: "No priority" },
          { value: "1", sample: "1", label: "Urgent" },
          { value: "2", sample: "2", label: "High" },
          { value: "3", sample: "3", label: "Medium" },
          { value: "4", sample: "4", label: "Low" },
        ],
      },
    ],
    sample: {
      data: {
        projectCreate: {
          project: { id: "a25cce1b-510d-433f-af50-1373efc05a4a", url: "https://www.example.com", name: "My title" },
          success: true,
        },
      },
    },
  },
};
