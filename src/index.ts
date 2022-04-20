import { addBearerHeader, authentication } from "./authentication";
import { createIssue } from "./creates/createIssue";
import { newComment } from "./triggers/comment";
import { newIssue, updatedIssue } from "./triggers/issue";
import { team } from "./triggers/team";
import { status } from "./triggers/status";
import { label } from "./triggers/label";
import { user } from "./triggers/user";
import { project } from "./triggers/project";
import { HttpResponse, ZObject } from "zapier-platform-core";
import { createComment } from "./creates/createComment";

const handleErrors = (response: HttpResponse, z: ZObject) => {
  if (response.request.url !== "https://api.linear.app/graphql") {
    return response;
  }
  
  if (response.status === 200) {
    const data = response.json as any;
    const error = data.errors ? data.errors[0] : undefined;
    z.console.log("handling errors", data);
    if (error && error.extensions.type === "authentication error") {
      throw new z.errors.ExpiredAuthError(`Authentication with Linear failed. Please reconnect.`);
    }
  } else {
    z.console.log("Catch error", response.status, response.json);
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
    [newComment.key]: newComment,
    [team.key]: team,
    [status.key]: status,
    [project.key]: project,
    [label.key]: label,
    [user.key]: user,
  },
  authentication,
  beforeRequest: [addBearerHeader],
  afterResponse: [handleErrors],
  version: require("../package.json").version,
};

export default App;
