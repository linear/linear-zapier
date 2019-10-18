import { authentication } from "./authentication";
import { createIssue } from "./creates/createIssue";
import { team } from "./triggers/team";
import { status } from "./triggers/status";
import { user } from "./triggers/user";

const App = {
  platformVersion: require("zapier-platform-core").version,
  creates: { [createIssue.key]: createIssue },
  triggers: {
    [team.key]: team,
    [status.key]: status,
    [user.key]: user,
  },
  authentication: authentication,
  version: require("../package.json").version,
};

export default App;
