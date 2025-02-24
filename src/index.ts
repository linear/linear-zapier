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
import { newDocumentCommentInstant } from "./triggers/commentDocumentV2";
import { newIssueCommentInstant } from "./triggers/commentIssueV2";
import { newProjectUpdateCommentInstant } from "./triggers/commentProjectUpdateV2";
import { newProjectUpdateInstant, updatedProjectUpdateInstant } from "./triggers/projectUpdateV2";
import { projectWithoutTeam } from "./triggers/projectWithoutTeam";
import { newIssueInstant, updatedIssueInstant } from "./triggers/issueV2";
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
    [newIssue.key]: newIssue,
    [newIssueInstant.key]: newIssueInstant,
    [updatedIssue.key]: updatedIssue,
    [updatedIssueInstant.key]: updatedIssueInstant,
    [newIssueComment.key]: newIssueComment,
    [newIssueCommentInstant.key]: newIssueCommentInstant,
    [newProjectUpdate.key]: newProjectUpdate,
    [newProjectUpdateInstant.key]: newProjectUpdateInstant,
    [newProjectUpdateComment.key]: newProjectUpdateComment,
    [newProjectUpdateCommentInstant.key]: newProjectUpdateCommentInstant,
    [newDocumentComment.key]: newDocumentComment,
    [newDocumentCommentInstant.key]: newDocumentCommentInstant,
    [updatedProjectUpdate.key]: updatedProjectUpdate,
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
