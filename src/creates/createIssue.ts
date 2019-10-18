export const createIssue = {
  operation: {
    perform: {
      body: {
        query: `
          mutation {
            issueCreate(input: 
              {
                teamId: "{{bundle.inputData.team_id}}",
                title: "{{bundle.inputData.title}}",
                description: "{{bundle.inputData.description}}",
                stateId: "{{bundle.inputData.status_id}}"
                assigneeId: "{{bundle.inputData.assignee_id}}"
              }
            ) {
              success
            }
          }`,
      },
      url: "https://api.linear.app/graphql",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: "{{bundle.authData.api_key}}",
      },
      params: { api_key: "{{bundle.authData.api_key}}" },
      method: "POST",
    },
    inputFields: [
      {
        required: true,
        label: "Team",
        key: "team_id",
        helpText: "The team for which the issue will be created",
        dynamic: "team.id.name",
        altersDynamicFields: true,
      },
      {
        required: true,
        label: "Title",
        helpText: "The title of the issue",
        key: "title",
      },
      {
        required: false,
        label: "Description",
        helpText: "The description of the issue in markdown format",
        key: "description",
      },
      {
        required: false,
        label: "Assignee",
        helpText: "The assignee of the issue",
        key: "assignee_id",
        dynamic: "user.id.name",
      },
      {
        required: false,
        label: "Status",
        helpText: "The status of the issue",
        key: "status_id",
        dynamic: "status.id.name",
      },
    ],
    sample: { data: { issueCreate: { success: true } } },
  },
  noun: "Issue",
  display: {
    hidden: false,
    important: true,
    description: "Create an Issue",
    label: "Create issue",
  },
  key: "create_issue",
};
