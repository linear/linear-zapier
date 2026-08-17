const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const isVersion = (value) => typeof value === "string" && VERSION_PATTERN.test(value);

const compareVersions = (a, b) => {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
};

const nextVersions = (version) => {
  const [major, minor, patch] = version.split(".").map(Number);
  return [`${major}.${minor}.${patch + 1}`, `${major}.${minor + 1}.0`, `${major + 1}.0.0`];
};

module.exports = { isVersion, compareVersions, nextVersions };
