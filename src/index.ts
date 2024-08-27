import { addBearerHeader, authentication } from "./authentication";
import { createIssue } from "./creates/createIssue";
import { newIssueComment } from "./triggers/commentIssue";
import { newProjectUpdateComment } from "./triggers/commentProjectUpdate";
import { newDocumentComment } from "./triggers/commentDocument";
import { newIssue, updatedIssue } from "./triggers/issue";
import { team } from "./triggers/team";
import { status } from "./triggers/status";
import { label } from "./triggers/label";
import { user } from "./triggers/user";
import { project } from "./triggers/project";
import { newProjectUpdate, updatedProjectUpdate } from "./triggers/projectUpdate";
import { projectMilestone } from "./triggers/projectMilestone";
import { HttpResponse, ZObject } from "zapier-platform-core";
import { createComment } from "./creates/createComment";
import { estimate } from "./triggers/estimate";
import { newDocumentCommentV2 } from "./triggers/commentDocumentV2";

const handleErrors = (response: HttpResponse, z: ZObject) => {
  if (response.request.url !== "https://linear-dev-zapier.ngrok.io/graphql") {
    return response;
  }

  if (response.status === 200) {
    const data = response.json as any;
    const error = data.errors ? data.errors[0] : undefined;
    if (error && error.extensions.type === "authentication error") {
      throw new z.errors.ExpiredAuthError(`Authentication with Linear failed. Please reconnect.`);
    }
  } else {
    z.console.log("Catch error", response.status, response.json);
    z.console.log("Error extensions", response.json.errors?.extensions);
    throw new z.errors.Error(`Something went wrong`, "request_execution_failed", 400);
  }
  return response;
};

const App = {
  platformVersion: require("zapier-platform-core").version,
  creates: {
    [createIssue.key]: createIssue,
    [createComment.key]: createComment,
  },
  triggers: {
    [newIssue.key]: newIssue,
    [updatedIssue.key]: updatedIssue,
    [newIssueComment.key]: newIssueComment,
    [newProjectUpdate.key]: newProjectUpdate,
    [newProjectUpdateComment.key]: newProjectUpdateComment,
    [newDocumentComment.key]: newDocumentComment,
    [newDocumentCommentV2.key]: newDocumentCommentV2,
    [updatedProjectUpdate.key]: updatedProjectUpdate,
    [team.key]: team,
    [status.key]: status,
    [project.key]: project,
    [projectMilestone.key]: projectMilestone,
    [label.key]: label,
    [user.key]: user,
    [estimate.key]: estimate,
  },
  authentication,
  beforeRequest: [addBearerHeader],
  afterResponse: [handleErrors],
  version: require("../package.json").version,
};

export default App;
