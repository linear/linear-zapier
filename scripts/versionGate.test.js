const { versionGateReason } = require("./versionGate");

const manifest = (version, dependencies = { lodash: "4.17.21" }) => ({ name: "linear-zapier", version, dependencies });

const gate = ({ changedFiles = [], master = manifest("4.15.0"), head = manifest("4.16.0"), changelog = "## 4.16.0" }) =>
  versionGateReason({ changedFiles, masterManifest: master, headManifest: head, changelog });

describe("versionGateReason", () => {
  it("asks for a bump when shipped code changes and the version stands still", () => {
    const reason = gate({ changedFiles: ["src/searches/foo.ts"], head: manifest("4.15.0") });
    expect(reason).toMatch(/not a valid next version after master's 4\.15\.0/);
  });

  it("passes a shipped change with a raised version and a changelog entry", () => {
    expect(gate({ changedFiles: ["src/searches/foo.ts"] })).toBeNull();
  });

  it("asks for a changelog entry when the version is raised without one", () => {
    const reason = gate({ changedFiles: ["src/searches/foo.ts"], changelog: "## 4.15.0" });
    expect(reason).toMatch(/CHANGELOG\.md has no '## 4\.16\.0' entry/);
  });

  it("names both versions when the branch is behind master", () => {
    const reason = gate({ changedFiles: ["src/searches/foo.ts"], head: manifest("4.14.0") });
    expect(reason).toContain("4.14.0");
    expect(reason).toContain("4.15.0");
  });

  it("rejects a version equal to master's", () => {
    expect(gate({ changedFiles: ["src/searches/foo.ts"], head: manifest("4.15.0") })).not.toBeNull();
  });

  it("ignores a change that does not reach Zapier", () => {
    expect(gate({ changedFiles: ["README.md"], head: manifest("4.15.0") })).toBeNull();
  });

  it("ignores a test-only change", () => {
    expect(gate({ changedFiles: ["src/test/foo.test.js"], head: manifest("4.15.0") })).toBeNull();
  });

  it("ignores a lockfile-only change, since devDependency churn does not ship", () => {
    expect(gate({ changedFiles: ["yarn.lock"], head: manifest("4.15.0") })).toBeNull();
  });

  it("ignores a devDependency difference", () => {
    const master = { ...manifest("4.15.0"), devDependencies: { jest: "29.7.0" } };
    const head = { ...manifest("4.15.0"), devDependencies: { jest: "30.0.0" } };
    expect(gate({ master, head })).toBeNull();
  });

  it("treats a dependency difference as shipped", () => {
    const head = manifest("4.15.0", { lodash: "4.17.22" });
    expect(gate({ head, changelog: "## 4.15.0" })).not.toBeNull();
  });

  it("matches the changelog heading exactly", () => {
    const reason = gate({ changedFiles: ["src/searches/foo.ts"], changelog: "## 4.16.01" });
    expect(reason).toMatch(/CHANGELOG\.md has no '## 4\.16\.0' entry/);
  });

  it("passes a patch successor of master's version", () => {
    const reason = gate({ changedFiles: ["src/searches/foo.ts"], head: manifest("4.15.1"), changelog: "## 4.15.1" });
    expect(reason).toBeNull();
  });

  it("passes a major successor of master's version", () => {
    const reason = gate({ changedFiles: ["src/searches/foo.ts"], head: manifest("5.0.0"), changelog: "## 5.0.0" });
    expect(reason).toBeNull();
  });

  it("rejects a minor bump that skips 4.16.x", () => {
    const reason = gate({ changedFiles: ["src/searches/foo.ts"], head: manifest("4.17.0"), changelog: "## 4.17.0" });
    expect(reason).toContain(
      "This branch changes code that reaches Zapier, but 4.17.0 is not a valid next version after master's 4.15.0. Zapier requires sequential versions, so use 4.15.1, 4.16.0, or 5.0.0."
    );
  });

  it("rejects a patch bump that skips 4.15.1", () => {
    const reason = gate({ changedFiles: ["src/searches/foo.ts"], head: manifest("4.15.2"), changelog: "## 4.15.2" });
    expect(reason).toMatch(/4\.15\.2 is not a valid next version after master's 4\.15\.0/);
  });
});
