import { authentication } from "./authentication";
import { createIssue } from "./creates/createIssue";
import { team } from "./triggers/team";
import { status } from "./triggers/status";
import { label } from "./triggers/label";
import { user } from "./triggers/user";
import { project } from "./triggers/project";

const App = {
  platformVersion: require("zapier-platform-core").version,
  creates: { [createIssue.key]: createIssue },
  triggers: {
    [team.key]: team,
    [status.key]: status,
    [project.key]: project,
    [label.key]: label,
    [user.key]: user,
  },
  authentication: authentication,
  version: require("../package.json").version,
};

export default App;
