import { addBearerHeader, authentication } from "./authentication";
import { createIssue } from "./creates/createIssue";
import { newIssueCommentLegacy } from "./triggers/legacy/commentIssue";
import { newProjectUpdateCommentLegacy } from "./triggers/legacy/commentProjectUpdate";
import { newDocumentCommentLegacy } from "./triggers/legacy/commentDocument";
import { newIssueLegacy, updatedIssueLegacy } from "./triggers/legacy/issue";
import { team } from "./triggers/team";
import { status } from "./triggers/status";
import { label } from "./triggers/label";
import { user } from "./triggers/user";
import { project } from "./triggers/project";
import { newProjectUpdateLegacy, updatedProjectUpdateLegacy } from "./triggers/legacy/projectUpdate";
import { projectMilestone } from "./triggers/projectMilestone";
import { HttpResponse, ZObject } from "zapier-platform-core";
import { createComment } from "./creates/createComment";
import { estimate } from "./triggers/estimate";
import { newDocumentCommentInstant } from "./triggers/commentDocument";
import { newIssueCommentInstant } from "./triggers/commentIssue";
import { newProjectUpdateCommentInstant } from "./triggers/commentProjectUpdate";
import { newProjectUpdateInstant, updatedProjectUpdateInstant } from "./triggers/projectUpdate";
import { projectWithoutTeam } from "./triggers/projectWithoutTeam";
import { newIssueInstant, updatedIssueInstant } from "./triggers/issue";
import { initiative } from "./triggers/initiative";
import { projectStatus } from "./triggers/projectStatus";
import { newProjectInstant, updatedProjectInstant } from "./triggers/newProject";
import { createIssueAttachment } from "./creates/createIssueAttachment";
import { createProject } from "./creates/createProject";
import { updateIssue } from "./creates/updateIssue";
import { issueTemplates } from "./triggers/issueTemplates";
import { findIssueByID } from "./searches/issue";
import { findProjectByID } from "./searches/project";
import { newInitiativeUpdateInstant, updatedInitiativeUpdateInstant } from "./triggers/initiativeUpdate";
import { createCustomer } from "./creates/createCustomer";
import { findCustomerByID } from "./searches/customer";
import { newCustomerInstant, updatedCustomerInstant } from "./triggers/customer";
import { createCustomerNeed } from "./creates/createCustomerNeed";
import { newCustomerNeedInstant, updatedCustomerNeedInstant } from "./triggers/customerNeed";
import { addIssueLabel } from "./creates/addIssueLabel";
import { removeIssueLabel } from "./creates/removeIssueLabel";

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
    [addIssueLabel.key]: addIssueLabel,
    [removeIssueLabel.key]: removeIssueLabel,
    [createComment.key]: createComment,
    [createIssueAttachment.key]: createIssueAttachment,
    [createProject.key]: createProject,
    [updateIssue.key]: updateIssue,
    [createCustomer.key]: createCustomer,
    [createCustomerNeed.key]: createCustomerNeed,
  },
  triggers: {
    // Legacy triggers are all hidden and no longer used, but we can't remove them because Zapier considers that a breaking change.
    [newIssueLegacy.key]: newIssueLegacy,
    [newIssueInstant.key]: newIssueInstant,
    [updatedIssueLegacy.key]: updatedIssueLegacy,
    [updatedIssueInstant.key]: updatedIssueInstant,
    [newIssueCommentLegacy.key]: newIssueCommentLegacy,
    [newIssueCommentInstant.key]: newIssueCommentInstant,
    [newProjectUpdateLegacy.key]: newProjectUpdateLegacy,
    [updatedProjectUpdateLegacy.key]: updatedProjectUpdateLegacy,

    // New triggers are all visible and used
    [newProjectUpdateInstant.key]: newProjectUpdateInstant,
    [newProjectUpdateCommentLegacy.key]: newProjectUpdateCommentLegacy,
    [newProjectUpdateCommentInstant.key]: newProjectUpdateCommentInstant,
    [newDocumentCommentLegacy.key]: newDocumentCommentLegacy,
    [newDocumentCommentInstant.key]: newDocumentCommentInstant,
    [updatedProjectUpdateInstant.key]: updatedProjectUpdateInstant,
    [newInitiativeUpdateInstant.key]: newInitiativeUpdateInstant,
    [updatedInitiativeUpdateInstant.key]: updatedInitiativeUpdateInstant,
    [team.key]: team,
    [issueTemplates.key]: issueTemplates,
    [status.key]: status,
    [project.key]: project,
    [projectWithoutTeam.key]: projectWithoutTeam,
    [projectMilestone.key]: projectMilestone,
    [label.key]: label,
    [user.key]: user,
    [estimate.key]: estimate,
    [initiative.key]: initiative,
    [projectStatus.key]: projectStatus,
    [newProjectInstant.key]: newProjectInstant,
    [updatedProjectInstant.key]: updatedProjectInstant,
    [newCustomerInstant.key]: newCustomerInstant,
    [updatedCustomerInstant.key]: updatedCustomerInstant,
    [newCustomerNeedInstant.key]: newCustomerNeedInstant,
    [updatedCustomerNeedInstant.key]: updatedCustomerNeedInstant,
  },
  searches: {
    [findIssueByID.key]: findIssueByID,
    [findProjectByID.key]: findProjectByID,
    [findCustomerByID.key]: findCustomerByID,
  },
  authentication,
  beforeRequest: [addBearerHeader],
  afterResponse: [handleErrors],
  version: require("../package.json").version,
};

export default App;
