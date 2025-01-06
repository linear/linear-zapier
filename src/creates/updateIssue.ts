import { Bundle, ZObject } from "zapier-platform-core";
import { fetchFromLinear } from "../fetchFromLinear";
import { omitBy, uniq } from "lodash";

interface IssueUpdateResponse {
  data?: {
    issueUpdate: {
      issue: {
        id: string;
        title: string;
        url: string;
        identifier: string;
      };
      success: boolean;
    };
  };
  errors?: {
    message: string;
    extensions?: {
      userPresentableMessage?: string;
    };
  }[];
}

interface IssueResponse {
  data: { issue: { labelIds: string[] } };
}

const updateIssueRequest = async (z: ZObject, bundle: Bundle) => {
  if (!bundle.inputData.issueIdToUpdate) {
    throw new z.errors.HaltedError("You must specify the ID of the issue to update");
  }
  const priority = bundle.inputData.priority ? parseInt(bundle.inputData.priority) : undefined;
  const estimate = bundle.inputData.estimate ? parseInt(bundle.inputData.estimate) : undefined;
  const addedLabelIds: string[] | undefined =
    bundle.inputData.labels && bundle.inputData.labels.length > 0 ? bundle.inputData.labels : undefined;

  const variables = omitBy(
    {
      issueIdToUpdate: bundle.inputData.issueIdToUpdate,
      teamId: bundle.inputData.teamId,
      title: bundle.inputData.title,
      description: bundle.inputData.description,
      priority: priority,
      estimate: estimate,
      stateId: bundle.inputData.statusId,
      parentId: bundle.inputData.parentId,
      assigneeId: bundle.inputData.assigneeId,
      projectId: bundle.inputData.projectId,
      projectMilestoneId: bundle.inputData.projectMilestoneId,
      dueDate: bundle.inputData.dueDate,
      addedLabelIds,
    },
    (v) => v === undefined
  );

  const query = `
      mutation ZapierIssueUpdate(
        $issueIdToUpdate: String!,
        $teamId: String,
        $title: String,
        $description: String,
        $priority: Int,
        $estimate: Int,
        $stateId: String,
        $parentId: String,
        $assigneeId: String,
        $projectId: String,
        $projectMilestoneId: String,
        $dueDate: TimelessDate,
        $addedLabelIds: [String!]
      ) {
        issueUpdate(id: $issueIdToUpdate, input: {
          teamId: $teamId,
          title: $title,
          description: $description,
          priority: $priority,
          estimate: $estimate,
          stateId: $stateId,
          parentId: $parentId,
          assigneeId: $assigneeId,
          projectId: $projectId,
          projectMilestoneId: $projectMilestoneId,
          dueDate: $dueDate,
          addedLabelIds: $addedLabelIds
        }) {
          issue {
            id
            identifier
            title
            url
          }
          success
        }
      }`;

  const response = await fetchFromLinear(z, bundle, query, variables);
  const data = response.json as IssueUpdateResponse;
  if (data.errors && data.errors.length) {
    const error = data.errors[0];
    throw new z.errors.Error(
      (error.extensions && error.extensions.userPresentableMessage) || error.message,
      "invalid_input",
      400
    );
  }

  if (data.data && data.data.issueUpdate && data.data.issueUpdate.success) {
    return data.data.issueUpdate.issue;
  } else {
    const error = data.errors ? data.errors[0].message : "Something went wrong";
    throw new z.errors.Error("Failed to update the issue", error, 400);
  }
};

export const updateIssue = {
  key: "updateIssue",
  display: {
    hidden: false,
    description: "Update an existing issue in Linear",
    label: "Update Issue",
  },
  noun: "Issue",
  operation: {
    perform: updateIssueRequest,
    inputFields: [
      {
        label: "Issue ID",
        key: "issueIdToUpdate",
        helpText: "The ID of the issue to update",
        required: true,
        altersDynamicFields: true,
      },
      {
        label: "Team",
        key: "teamId",
        helpText: "The team to move the issue to. If this is left blank, the issue will stay in its current team.",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      {
        label: "Title",
        helpText: "The new title of the issue",
        key: "title",
      },
      {
        label: "Description",
        helpText: "The new description of the issue in markdown format",
        key: "description",
        type: "text",
      },
      {
        label: "Parent Issue",
        helpText: "The ID of the parent issue to set",
        type: "string",
        key: "parentId",
      },
      {
        label: "Status",
        helpText:
          "The new status of the issue. If you're moving the issue to a new team, this list will be populated with the statuses of the new team.",
        key: "statusId",
        dynamic: "status.id.name",
      },
      {
        label: "Assignee",
        helpText: "The new assignee of the issue",
        key: "assigneeId",
        dynamic: "user.id.name",
      },
      {
        label: "Priority",
        helpText: "The new priority of the issue",
        key: "priority",
        choices: [
          { value: "0", sample: "0", label: "No priority" },
          { value: "1", sample: "1", label: "Urgent" },
          { value: "2", sample: "2", label: "High" },
          { value: "3", sample: "3", label: "Medium" },
          { value: "4", sample: "4", label: "Low" },
        ],
      },
      {
        label: "Estimate",
        helpText: "The new estimate of the issue",
        key: "estimate",
        dynamic: "estimate.id.label",
      },
      {
        label: "Labels",
        helpText:
          "Labels to add to the issue. If you're moving the issue to a new team, this list will be populated with workspace labels and labels of the new team.",
        key: "labels",
        dynamic: "label.id.name",
        list: true,
      },
      {
        label: "Project",
        helpText:
          "The project to move the issue to. If you're moving the issue to a new team, this list will be populated with the projects of the new team.",
        key: "projectId",
        dynamic: "project.id.name",
      },
      {
        label: "Project Milestone",
        helpText: "The project milestone to move the issue to",
        key: "projectMilestoneId",
        dynamic: "project_milestone.id.name",
      },
      {
        label: "Due Date",
        helpText: "The issue due date in `yyyy-MM-dd` format",
        key: "dueDate",
        type: "string",
      },
    ],
    sample: {
      data: {
        id: "7b647c45-c528-464d-8634-eecea0f73033",
        title: "Do the roar",
        url: "https://linear.app/linear/issue/ENG-118/do-the-roar",
        identifier: "ENG-118",
      },
    },
  },
};
