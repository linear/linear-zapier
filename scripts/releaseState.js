const fs = require("fs");
const path = require("path");

const { isVersion, compareVersions } = require("./version");

const ROOT = path.join(__dirname, "..");
const PACKAGE_FILE = path.join(ROOT, "package.json");
const PROMOTION_OUTCOMES = { errored: "failed", aborted: "failed", paused: "paused" };

const promotionStage = (jobs, version, knownJobIds = []) => {
  const known = new Set(knownJobIds);
  const promotions = jobs.filter(
    (job) => job.job_kind === "promote" && job.version_to === version && !known.has(job.job_id)
  );
  if (promotions.some((job) => job.job_stage === "complete")) {
    return "complete";
  }
  const ended = promotions.findLast((job) => PROMOTION_OUTCOMES[job.job_stage]);
  return ended ? PROMOTION_OUTCOMES[ended.job_stage] : "pending";
};

const highestVersion = (versions) =>
  versions
    .map((row) => row.version)
    .filter(isVersion)
    .sort(compareVersions)
    .pop();

const releaseState = (version, versions, jobs) => {
  if (!isVersion(version)) {
    return { action: "fail", reason: `unexpected version format: ${version}` };
  }

  const highest = highestVersion(versions);
  if (highest && compareVersions(version, highest) < 0) {
    return {
      action: "fail",
      reason: `${version} is below ${highest}, which Zapier already holds, so releasing it would move Zapier backwards.`,
    };
  }

  const row = versions.find((v) => v.version === version);
  if (!row) {
    return { action: "publish" };
  }
  if (row.state === "deprecated") {
    return { action: "fail", reason: `${version} is deprecated on Zapier.` };
  }

  const stage = promotionStage(jobs, version);
  if (stage === "failed") {
    return { action: "promote", reason: `${version} promotion ended as failed.` };
  }
  if (stage === "paused") {
    return {
      action: "fail",
      reason: `A person paused the ${version} promotion on Zapier's side, so it is not retried automatically.`,
    };
  }
  return { action: "none" };
};

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

module.exports = { promotionStage, releaseState };

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === "promotion-stage") {
    const [, version, jobsFile, knownJobsFile] = args;
    const knownJobIds = knownJobsFile ? read(knownJobsFile).map((job) => job.job_id) : [];
    process.stdout.write(`${promotionStage(read(jobsFile), version, knownJobIds)}\n`);
  } else {
    const [versionsFile, jobsFile] = args;
    const { version } = read(PACKAGE_FILE);
    const state = releaseState(version, read(versionsFile), read(jobsFile));

    if (state.reason) {
      process.stderr.write(`${state.reason}\n`);
    }
    if (state.action === "fail") {
      process.exit(1);
    }
    process.stdout.write(`action=${state.action}\nversion=${version}\n`);
  }
}
