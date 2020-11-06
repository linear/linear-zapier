import { addBearerHeader, authentication } from "./authentication";
import { createIssue } from "./creates/createIssue";
import {  newIssue, updatedIssue } from "./triggers/issue";
import { team } from "./triggers/team";
import { status } from "./triggers/status";
import { label } from "./triggers/label";
import { user } from "./triggers/user";
import { project } from "./triggers/project";

const App = {
  platformVersion: require("zapier-platform-core").version,
  creates: { [createIssue.key]: createIssue },
  triggers: {
    [newIssue.key]: newIssue,
    [updatedIssue.key]: updatedIssue,
    [team.key]: team,
    [status.key]: status,
    [project.key]: project,
    [label.key]: label,
    [user.key]: user,
  },
  authentication,
  beforeRequest: [addBearerHeader],
  version: require("../package.json").version,
};

export default App;
