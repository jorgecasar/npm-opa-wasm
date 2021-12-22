import { readFileSync } from "fs";
import { execFileSync } from "child_process";
import { loadPolicy } from "../src/opa.js";

describe("yaml support", () => {
  const fixturesFolder = "test/fixtures/yaml-support";

  let policy;

  beforeAll(async () => {
    const bundlePath = `${fixturesFolder}/bundle.tar.gz`;

    execFileSync("opa", [
      "build",
      fixturesFolder,
      "-o",
      bundlePath,
      "-t",
      "wasm",
      "-e",
      "yaml/support/canParseYAML",
      "-e",
      "yaml/support/hasSyntaxError",
      "-e",
      "yaml/support/hasSemanticError",
      "-e",
      "yaml/support/hasReferenceError",
      "-e",
      "yaml/support/hasYAMLWarning",
      "-e",
      "yaml/support/canMarshalYAML",
      "-e",
      "yaml/support/isValidYAML",
    ]);

    execFileSync("tar", [
      "-xzf",
      bundlePath,
      "-C",
      `${fixturesFolder}/`,
      "/policy.wasm",
    ]);

    const policyWasm = readFileSync(`${fixturesFolder}/policy.wasm`);
    const opts = { initial: 5, maximum: 10 };
    policy = await loadPolicy(policyWasm, opts);
  });

  it("should unmarshall YAML strings", () => {
    const result = policy.evaluate({}, "yaml/support/canParseYAML");
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: true });
  });

  it("should ignore YAML syntax errors", () => {
    expect(() => policy.evaluate({}, "yaml/support/hasSyntaxError")).not
      .toThrow();
    const result = policy.evaluate({}, "yaml/support/hasSyntaxError");
    expect(result.length).toBe(0);
  });

  it("should ignore YAML semantic errors", () => {
    expect(() => policy.evaluate({}, "yaml/support/hasSemanticError")).not
      .toThrow();
    const result = policy.evaluate({}, "yaml/support/hasSemanticError");
    expect(result.length).toBe(0);
  });

  it("should ignore YAML reference errors", () => {
    expect(() => policy.evaluate({}, "yaml/support/hasReferenceError")).not
      .toThrow();
    const result = policy.evaluate({}, "yaml/support/hasReferenceError");
    expect(result.length).toBe(0);
  });

  it("should ignore YAML warnings", () => {
    expect(() => policy.evaluate({}, "yaml/support/hasYAMLWarning")).not
      .toThrow();
    const result = policy.evaluate({}, "yaml/support/hasYAMLWarning");
    expect(result.length).toBe(0);
  });

  it("should marshal yaml", () => {
    const result = policy.evaluate(
      [{ foo: [1, 2, 3] }],
      "yaml/support/canMarshalYAML",
    );
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({ result: [[{ foo: [1, 2, 3] }]] });
  });

  it("should validate yaml", () => {
    const result = policy.evaluate({}, "yaml/support/isValidYAML");
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({ result: true });
  });
});
