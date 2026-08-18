const fs = require("fs");
const path = require("path");

const { isVersion, nextVersions } = require("./version");

const ROOT = path.join(__dirname, "..");
const SHIPPED_PREFIXES = ["src/"];
const SHIPPED_FILES = ["index.js", "tsconfig.json"];

const canonicalDependencies = (manifest) => {
  const dependencies = manifest.dependencies || {};
  return JSON.stringify(
    Object.keys(dependencies)
      .sort()
      .map((name) => [name, dependencies[name]])
  );
};

const reachesZapier = (file) =>
  !file.startsWith("src/test/") &&
  (SHIPPED_FILES.includes(file) || SHIPPED_PREFIXES.some((prefix) => file.startsWith(prefix)));

const versionGateReason = ({ changedFiles, masterManifest, headManifest, changelog }) => {
  const shipped =
    changedFiles.some(reachesZapier) || canonicalDependencies(masterManifest) !== canonicalDependencies(headManifest);
  if (!shipped) {
    return null;
  }

  const master = masterManifest.version;
  const head = headManifest.version;
  if (!isVersion(head)) {
    return `The version in package.json is ${head}, which is not three dot-separated numbers.`;
  }
  if (!isVersion(master)) {
    return `The version on master is ${master}, which is not three dot-separated numbers.`;
  }
  const valid = nextVersions(master);
  if (!valid.includes(head)) {
    return `This branch changes code that reaches Zapier, but ${head} is not a valid next version after master's ${master}. Zapier requires sequential versions, so use ${valid[0]}, ${valid[1]}, or ${valid[2]}.`;
  }
  if (!changelog.split("\n").includes(`## ${head}`)) {
    return `CHANGELOG.md has no '## ${head}' entry, and Zapier reads that entry when the version is promoted.`;
  }
  return null;
};

const read = (file) => fs.readFileSync(file, "utf8");

module.exports = { reachesZapier, versionGateReason };

if (require.main === module) {
  const [changedFile, masterPackageFile] = process.argv.slice(2);
  const masterManifest = JSON.parse(read(masterPackageFile));
  const headManifest = JSON.parse(read(path.join(ROOT, "package.json")));
  const reason = versionGateReason({
    changedFiles: read(changedFile)
      .split("\n")
      .filter((file) => file !== ""),
    masterManifest,
    headManifest,
    changelog: read(path.join(ROOT, "CHANGELOG.md")),
  });

  if (reason) {
    process.stderr.write(`${reason}\n`);
    process.exit(1);
  }
  if (masterManifest.version === headManifest.version) {
    process.stdout.write(`nothing that reaches Zapier changed, so the version stays at ${headManifest.version}\n`);
  } else {
    process.stdout.write(`version ${masterManifest.version} -> ${headManifest.version}\n`);
  }
}
