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
const getTeamList = (z, bundle) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield z.request({
        url: "https://api.linear.app/graphql",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            authorization: bundle.authData.api_key,
        },
        body: { query: "query { teams { id name archivedAt }}" },
        method: "POST",
    });
    return response.json.data.teams.filter(team => team.archivedAt === null);
});
exports.team = {
    key: "team",
    noun: "Team",
    display: {
        label: "Get team",
        hidden: true,
        description: "The only purpose of this trigger is to populate the dropdown list of repos in the UI, thus, it's hidden.",
    },
    operation: {
        perform: getTeamList,
    },
};
