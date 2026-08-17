const { promotionStage, releaseState } = require("./releaseState");

describe("promotionStage", () => {
  it("is pending when no job exists", () => {
    expect(promotionStage([], "4.16.0")).toBe("pending");
  });

  it("is complete when any promotion completed", () => {
    const jobs = [
      { job_kind: "promote", version_to: "4.16.0", job_stage: "complete" },
      { job_kind: "promote", version_to: "4.16.0", job_stage: "errored" },
    ];
    expect(promotionStage(jobs, "4.16.0")).toBe("complete");
  });

  it("maps errored and aborted to failed", () => {
    expect(promotionStage([{ job_kind: "promote", version_to: "4.16.0", job_stage: "errored" }], "4.16.0")).toBe(
      "failed"
    );
    expect(promotionStage([{ job_kind: "promote", version_to: "4.16.0", job_stage: "aborted" }], "4.16.0")).toBe(
      "failed"
    );
  });

  it("keeps paused apart from failed", () => {
    expect(promotionStage([{ job_kind: "promote", version_to: "4.16.0", job_stage: "paused" }], "4.16.0")).toBe(
      "paused"
    );
  });

  it("lets the newest ended job decide, so an error does not mask a later pause", () => {
    const jobs = [
      { job_kind: "promote", version_to: "4.16.0", job_stage: "errored" },
      { job_kind: "promote", version_to: "4.16.0", job_stage: "paused" },
    ];
    expect(promotionStage(jobs, "4.16.0")).toBe("paused");
  });

  it("ignores a job whose id is known", () => {
    const jobs = [{ job_id: "1", job_kind: "promote", version_to: "4.16.0", job_stage: "complete" }];
    expect(promotionStage(jobs, "4.16.0", ["1"])).toBe("pending");
  });

  it("is pending when a known errored job is the only one", () => {
    const jobs = [{ job_id: "1", job_kind: "promote", version_to: "4.16.0", job_stage: "errored" }];
    expect(promotionStage(jobs, "4.16.0", ["1"])).toBe("pending");
  });

  it("is complete when a new job completed after a known errored one", () => {
    const jobs = [
      { job_id: "1", job_kind: "promote", version_to: "4.16.0", job_stage: "errored" },
      { job_id: "2", job_kind: "promote", version_to: "4.16.0", job_stage: "complete" },
    ];
    expect(promotionStage(jobs, "4.16.0", ["1"])).toBe("complete");
  });

  it("ignores jobs for another version or another kind", () => {
    const jobs = [
      { job_kind: "promote", version_to: "4.15.0", job_stage: "complete" },
      { job_kind: "migrate", version_to: "4.16.0", job_stage: "complete" },
    ];
    expect(promotionStage(jobs, "4.16.0")).toBe("pending");
  });
});

describe("releaseState", () => {
  it("publishes a version Zapier does not hold", () => {
    expect(releaseState("4.16.0", [{ version: "4.15.0", state: "live" }], [])).toEqual({ action: "publish" });
  });

  it("does nothing when the version is live and no jobs exist", () => {
    expect(releaseState("4.16.0", [{ version: "4.16.0", state: "live" }], [])).toEqual({ action: "none" });
  });

  it("fails on a deprecated version", () => {
    const state = releaseState("4.16.0", [{ version: "4.16.0", state: "deprecated" }], []);
    expect(state.action).toBe("fail");
    expect(state.reason).toMatch(/deprecated/);
  });

  it("fails a version below the highest one Zapier holds", () => {
    const state = releaseState("4.16.0", [{ version: "4.17.0", state: "live" }], []);
    expect(state.action).toBe("fail");
    expect(state.reason).toContain("4.16.0");
    expect(state.reason).toContain("4.17.0");
  });

  it("refuses to promote a version below the highest one Zapier holds", () => {
    const versions = [
      { version: "4.16.0", state: "live" },
      { version: "4.15.0", state: "live" },
    ];
    const jobs = [{ job_kind: "promote", version_to: "4.15.0", job_stage: "errored" }];
    const state = releaseState("4.15.0", versions, jobs);
    expect(state.action).toBe("fail");
    expect(state.reason).toContain("4.15.0");
    expect(state.reason).toContain("4.16.0");
  });

  it("publishes above a highest version that string order would misread", () => {
    expect(releaseState("4.10.0", [{ version: "4.9.0", state: "live" }], [])).toEqual({ action: "publish" });
  });

  it("promotes again when the only promotion errored", () => {
    const jobs = [{ job_kind: "promote", version_to: "4.16.0", job_stage: "errored" }];
    const state = releaseState("4.16.0", [{ version: "4.16.0", state: "live" }], jobs);
    expect(state.action).toBe("promote");
    expect(state.reason).toMatch(/failed/);
  });

  it("fails when a person paused the promotion", () => {
    const jobs = [{ job_kind: "promote", version_to: "4.16.0", job_stage: "paused" }];
    const state = releaseState("4.16.0", [{ version: "4.16.0", state: "live" }], jobs);
    expect(state.action).toBe("fail");
    expect(state.reason).toMatch(/paused/);
  });

  it("does nothing when a later promotion completed", () => {
    const jobs = [
      { job_kind: "promote", version_to: "4.16.0", job_stage: "errored" },
      { job_kind: "promote", version_to: "4.16.0", job_stage: "complete" },
    ];
    expect(releaseState("4.16.0", [{ version: "4.16.0", state: "live" }], jobs)).toEqual({ action: "none" });
  });

  it("fails on a version it does not understand", () => {
    expect(releaseState("4.16", [], []).action).toBe("fail");
  });
});
