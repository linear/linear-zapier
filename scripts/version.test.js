const { isVersion, compareVersions, nextVersions } = require("./version");

describe("isVersion", () => {
  it("accepts three dot-separated numbers", () => {
    expect(isVersion("4.15.0")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isVersion("4.15")).toBe(false);
    expect(isVersion("v4.15.0")).toBe(false);
    expect(isVersion("")).toBe(false);
  });
});

describe("compareVersions", () => {
  it("orders by major", () => {
    expect(compareVersions("5.0.0", "4.99.99")).toBeGreaterThan(0);
    expect(compareVersions("4.99.99", "5.0.0")).toBeLessThan(0);
  });

  it("orders by minor", () => {
    expect(compareVersions("4.16.0", "4.15.9")).toBeGreaterThan(0);
  });

  it("orders by patch", () => {
    expect(compareVersions("4.15.1", "4.15.0")).toBeGreaterThan(0);
  });

  it("returns 0 for equal versions", () => {
    expect(compareVersions("4.15.0", "4.15.0")).toBe(0);
  });

  it("orders 4.9.0 below 4.10.0", () => {
    expect(compareVersions("4.9.0", "4.10.0")).toBeLessThan(0);
  });
});

describe("nextVersions", () => {
  it("returns the patch, minor, and major successors of 4.15.0", () => {
    expect(nextVersions("4.15.0")).toEqual(["4.15.1", "4.16.0", "5.0.0"]);
  });

  it("carries the minor successor of 4.9.0 to 4.10.0, not 4.1.0", () => {
    expect(nextVersions("4.9.0")).toEqual(["4.9.1", "4.10.0", "5.0.0"]);
  });

  it("returns the patch, minor, and major successors of 0.0.0", () => {
    expect(nextVersions("0.0.0")).toEqual(["0.0.1", "0.1.0", "1.0.0"]);
  });
});
