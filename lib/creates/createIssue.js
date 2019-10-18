"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const createIssueRequest = (z, bundle) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
      mutation {
        issueCreate(input: 
          {
            teamId: "${bundle.inputData.team_id}",
            title: "${bundle.inputData.title}",
            description: "${bundle.inputData.description}",
            stateId: ${bundle.inputData.state_id ? `"${bundle.inputData.state_id}"` : "null"},
            assigneeId: ${bundle.inputData.assignee_id ? `"${bundle.inputData.assignee_id}"` : "null"}
          }
        ) {
          success
        }
      }`;
    const response = yield z.request({
        url: "https://api.linear.app/graphql",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            authorization: bundle.authData.api_key,
        },
        body: {
            query,
        },
        method: "POST",
    });
    return response.json;
});
exports.createIssue = {
    key: "create_issue",
    display: {
        hidden: false,
        important: true,
        description: "Create an Issue",
        label: "Create issue",
    },
    noun: "Issue",
    operation: {
        perform: createIssueRequest,
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
};
