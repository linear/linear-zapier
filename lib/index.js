"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authentication_1 = require("./authentication");
const createIssue_1 = require("./creates/createIssue");
const team_1 = require("./triggers/team");
const status_1 = require("./triggers/status");
const user_1 = require("./triggers/user");
const App = {
    platformVersion: require("zapier-platform-core").version,
    creates: { [createIssue_1.createIssue.key]: createIssue_1.createIssue },
    triggers: {
        [team_1.team.key]: team_1.team,
        [status_1.status.key]: status_1.status,
        [user_1.user.key]: user_1.user,
    },
    authentication: authentication_1.authentication,
    version: require("../package.json").version,
};
exports.default = App;
